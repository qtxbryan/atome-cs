import json
import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from prompts.bot_prompt import build_system_prompt
from models import ChatHistoryMessage
from services.mock_tools import getCardStatus, getTransactionStatus

MODEL = os.environ.get("CHAT_MODEL", "gpt-4o-mini")

_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

TOOL_FUNCTIONS = {
    "getCardStatus": getCardStatus,
    "getTransactionStatus": getTransactionStatus,
}

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "name": "getCardStatus",
        "description": "Get the Atome card application status for a given application ID.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "application_id": {
                    "type": "string",
                    "description": "The unique card application identifier (e.g. APP12345).",
                }
            },
            "required": ["application_id"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "getTransactionStatus",
        "description": "Get the status and details of a payment transaction.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "transaction_id": {
                    "type": "string",
                    "description": "The unique transaction identifier (e.g. TXN9999).",
                }
            },
            "required": ["transaction_id"],
            "additionalProperties": False,
        },
    },
]

def _build_input(message: str, history: list[ChatHistoryMessage]) -> list[dict]:
    input_items: list[dict] = []
    for m in history:
        input_items.append({"role": m.role, "content": m.content})
    input_items.append({"role": "user", "content": message})
    return input_items

def _format_tool_result(tool_name: str, result: dict) -> str:
    """ Format tool results """
    if "error" in result:
        return f"Sorry, I couldn't retrieve that information: {result['error']}"

    if tool_name == "getCardStatus":
        lines = [
            f"Application **{result.get('application_id')}** is **{result.get('status')}**.",
            f"Applied on: {result.get('applied_date')}.",
        ]
        if result.get("estimated_days") is not None:
            lines.append(f"Estimated {result['estimated_days']} day(s) remaining.")
        return " ".join(lines)

    if tool_name == "getTransactionStatus":
        lines = [
            f"Transaction **{result.get('transaction_id')}** is **{result.get('status')}**.",
            f"Amount: {result.get('currency')} {result.get('amount'):.2f}",
            f"Merchant: {result.get('merchant')}",
            f"Date: {result.get('date')}",
        ]
        if result.get("failure_reason"):
            lines.append(f"Failure reason: {result['failure_reason']}")
        return " ".join(lines)

    return json.dumps(result)

def _execute_tool_calls(tool_calls: list[dict]) -> tuple[list[dict], list[dict]]:
    raw_results: list[dict] = []
    function_outputs: list[dict] = []

    for tool_call in tool_calls:
        fn = TOOL_FUNCTIONS.get(tool_call["name"])
        if fn is None:
            result: dict = {"error": f"Unknown tool: {tool_call['name']}"}
        else:
            try:
                args = json.loads(tool_call["arguments"])
                result = fn(**args)
            except json.JSONDecodeError as e:
                result = {"error": f"Malformed tool arguments: {e}"}
            except Exception as e:
                result = {"error": f"Tool execution failed: {e}"}

        raw_results.append(result)

        if not tool_call["call_id"]:
            raise ValueError(f"Missing call_id for tool call: {tool_call['name']}")

        formatted = _format_tool_result(tool_call["name"], result)
        function_outputs.append(
            {
                "type": "function_call_output",
                "call_id": tool_call["call_id"],
                "output": formatted,
            }
        )

    return raw_results, function_outputs


async def stream_chat(
    message: str, history: list[ChatHistoryMessage], config: dict
) -> AsyncIterator[str]:
    system_prompt = build_system_prompt(config)
    enabled_tools = config.get("tools_enabled", [])
    active_tool_defs = [
        t for t in TOOL_DEFINITIONS if t["name"] in enabled_tools
    ]
    response_input = _build_input(message, history)
    previous_response_id: str | None = None

    try:
        while True:
            kwargs: dict = {
                "model": MODEL,
                "input": response_input,
                "instructions": system_prompt,
                "stream": True,
            }
            if active_tool_defs:
                kwargs["tools"] = active_tool_defs
                kwargs["parallel_tool_calls"] = True
            if previous_response_id:
                kwargs["previous_response_id"] = previous_response_id

            stream = await _client.responses.create(**kwargs)
            tool_calls_acc: dict[int, dict] = {}

            async for event in stream:
                if event.type == "response.created":
                    previous_response_id = event.response.id
                    continue

                if event.type == "response.output_text.delta":
                    # JSON-encode so embedded newlines (\n) survive SSE line parsing
                    yield f"data: {json.dumps(event.delta)}\n\n"
                    continue

                if (
                    event.type == "response.output_item.added"
                    and event.item.type == "function_call"
                ):
                    tool_calls_acc[event.output_index] = {
                        "id": event.item.id,
                        "call_id": event.item.call_id,
                        "name": event.item.name,
                        "arguments": event.item.arguments or "",
                    }
                    yield f"event: tool_call\ndata: {event.item.name}\n\n"
                    continue

                if event.type == "response.function_call_arguments.delta":
                    key = event.output_index
                    if key not in tool_calls_acc:
                        tool_calls_acc[key] = {
                            "id": event.item_id,
                            "call_id": "",
                            "name": "",
                            "arguments": "",
                        }
                    tool_calls_acc[key]["arguments"] += event.delta
                    continue

                if event.type == "response.function_call_arguments.done":
                    key = event.output_index
                    if key not in tool_calls_acc:
                        tool_calls_acc[key] = {
                            "id": event.item_id,
                            "call_id": "",
                            "name": event.name,
                            "arguments": event.arguments,
                        }
                    else:
                        tool_calls_acc[key]["name"] = event.name
                        tool_calls_acc[key]["arguments"] = event.arguments
                    continue

                if (
                    event.type == "response.output_item.done"
                    and event.item.type == "function_call"
                ):
                    key = event.output_index
                    if key not in tool_calls_acc:
                        tool_calls_acc[key] = {
                            "id": event.item.id,
                            "call_id": event.item.call_id,
                            "name": event.item.name,
                            "arguments": event.item.arguments or "",
                        }
                    else:
                        tool_calls_acc[key]["id"] = event.item.id
                        tool_calls_acc[key]["call_id"] = event.item.call_id
                        tool_calls_acc[key]["name"] = event.item.name
                        tool_calls_acc[key]["arguments"] = event.item.arguments or tool_calls_acc[key]["arguments"]

            tool_calls = list(tool_calls_acc.values())
            if not tool_calls:
                break

            raw_results, response_input = _execute_tool_calls(tool_calls)

            # Emit each structured tool result so the frontend can render generative UI
            for result in raw_results:
                if "error" not in result:
                    yield f"event: tool_result\ndata: {json.dumps(result)}\n\n"
            yield "event: tool_done\ndata: \n\n"

        yield "event: done\ndata: \n\n"  # named event

    except Exception as e:
        yield f"event: error\ndata: {str(e)}\n\n"
