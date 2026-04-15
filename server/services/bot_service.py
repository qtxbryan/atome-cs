import json
import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from prompts.bot_prompt import build_system_prompt
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
        "function": {
            "name": "getCardStatus",
            "description": "Get the Atome card application status for a given application ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "application_id": {
                        "type": "string",
                        "description": "The unique card application identifier (e.g. APP12345).",
                    }
                },
                "required": ["application_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "getTransactionStatus",
            "description": "Get the status and details of a payment transaction.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transaction_id": {
                        "type": "string",
                        "description": "The unique transaction identifier (e.g. TXN9999).",
                    }
                },
                "required": ["transaction_id"],
            },
        },
    },
]

def _build_messages(
    message: str, history: list[dict], system_prompt: str
) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for m in history:
        role = "assistant" if m["role"] == "bot" else "user"
        messages.append({"role": role, "content": str(m["content"])})
    messages.append({"role": "user", "content": message})
    return messages

def _format_tool_result(tool_name: str, result: dict) -> str:
    """✅ Format tool results in Python — not by prompting the model."""
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

def _build_tool_calls_list(tool_calls_acc: dict[int, dict]) -> list[dict]:
    return [
        {
            "id": tool_calls_acc[i]["id"],
            "type": "function",
            "function": {
                "name": tool_calls_acc[i]["name"],
                "arguments": tool_calls_acc[i]["arguments"],
            },
        }
        for i in sorted(tool_calls_acc)
    ]

def _execute_tool_calls(
    tool_calls_acc: dict[int, dict], messages: list[dict]
) -> list[dict]:
    """Executes tool calls, mutates messages in place, returns raw results for SSE."""
    tool_calls_list = _build_tool_calls_list(tool_calls_acc)
    messages.append({"role": "assistant", "tool_calls": tool_calls_list})

    raw_results: list[dict] = []
    for tc in tool_calls_list:
        fn = TOOL_FUNCTIONS.get(tc["function"]["name"])
        if fn is None:
            result: dict = {"error": f"Unknown tool: {tc['function']['name']}"}
        else:
            try:
                args = json.loads(tc["function"]["arguments"])
                result = fn(**args)
            except json.JSONDecodeError as e:
                result = {"error": f"Malformed tool arguments: {e}"}
            except Exception as e:
                result = {"error": f"Tool execution failed: {e}"}

        raw_results.append(result)

        # Append human-readable summary for the model's next turn
        formatted = _format_tool_result(tc["function"]["name"], result)
        messages.append({
            "role": "tool",
            "tool_call_id": tc["id"],
            "content": formatted,
        })

    return raw_results
        

async def stream_chat(
    message: str, history: list[dict], config: dict
) -> AsyncIterator[str]:
    system_prompt = build_system_prompt(config)
    enabled_tools = config.get("tools_enabled", [])
    active_tool_defs = [
        t for t in TOOL_DEFINITIONS if t["function"]["name"] in enabled_tools
    ]
    messages = _build_messages(message, history, system_prompt)

    try:
        while True:
            kwargs: dict = {"model": MODEL, "messages": messages, "stream": True}
            if active_tool_defs:
                kwargs["tools"] = active_tool_defs

            stream = await _client.chat.completions.create(**kwargs)

            tool_calls_acc: dict[int, dict] = {}
            finish_reason = None

            async for chunk in stream:
                choice = chunk.choices[0]
                if choice.finish_reason:
                    finish_reason = choice.finish_reason
                delta = choice.delta

                if delta.content:
                    # JSON-encode so embedded newlines (\n) survive SSE line parsing
                    yield f"data: {json.dumps(delta.content)}\n\n"

                if delta.tool_calls:
                    for tc_delta in delta.tool_calls:
                        idx = tc_delta.index
                        if idx not in tool_calls_acc:
                            tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                        if tc_delta.id:
                            tool_calls_acc[idx]["id"] = tc_delta.id
                        if tc_delta.function and tc_delta.function.name:
                            name = tc_delta.function.name
                            if not tool_calls_acc[idx]["name"]:
                                # ✅ Named SSE event instead of magic string in data
                                yield f"event: tool_call\ndata: {name}\n\n"
                            tool_calls_acc[idx]["name"] = name
                        if tc_delta.function and tc_delta.function.arguments:
                            tool_calls_acc[idx]["arguments"] += tc_delta.function.arguments

            if finish_reason != "tool_calls":
                break

            raw_results = _execute_tool_calls(tool_calls_acc, messages)
            # Emit each structured tool result so the frontend can render generative UI
            for result in raw_results:
                if "error" not in result:
                    yield f"event: tool_result\ndata: {json.dumps(result)}\n\n"
            yield "event: tool_done\ndata: \n\n"

        yield "event: done\ndata: \n\n"  # ✅ named event

    except Exception as e:
        yield f"event: error\ndata: {str(e)}\n\n"