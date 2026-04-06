import json
import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from prompts.bot_prompt import build_system_prompt
from services.mock_tools import getCardStatus, getTransactionStatus

MODEL = "gpt-5-nano"

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


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
        # Always stream from the first call. If the model decides to call a tool,
        # we accumulate the tool call arguments from the streaming deltas, execute
        # the tools, append the results, and loop for the next streaming response.
        # This means text starts flowing to the client immediately on the first
        # turn that doesn't need tools, with no blocking pre-flight call.
        while True:
            kwargs: dict = {"model": MODEL, "messages": messages, "stream": True}
            if active_tool_defs:
                kwargs["tools"] = active_tool_defs

            stream = await _get_client().chat.completions.create(**kwargs)

            # Accumulate tool call argument fragments across streaming deltas.
            # Each tool call is keyed by its index in the delta list.
            tool_calls_acc: dict[int, dict] = {}
            finish_reason = None

            async for chunk in stream:
                choice = chunk.choices[0]
                if choice.finish_reason:
                    finish_reason = choice.finish_reason
                delta = choice.delta

                if delta.content:
                    yield f"data: {delta.content}\n\n"

                if delta.tool_calls:
                    for tc_delta in delta.tool_calls:
                        idx = tc_delta.index
                        if idx not in tool_calls_acc:
                            tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                        if tc_delta.id:
                            tool_calls_acc[idx]["id"] = tc_delta.id
                        if tc_delta.function and tc_delta.function.name:
                            name = tc_delta.function.name
                            # Emit tool call event on first name fragment so the
                            # UI can show the indicator immediately.
                            if not tool_calls_acc[idx]["name"]:
                                yield f"data: [TOOL_CALL] {name}\n\n"
                            tool_calls_acc[idx]["name"] = name
                        if tc_delta.function and tc_delta.function.arguments:
                            tool_calls_acc[idx]["arguments"] += tc_delta.function.arguments

            if finish_reason != "tool_calls":
                break

            # Build the assistant turn with accumulated tool calls and execute them.
            tool_calls_list = [
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
            messages.append({"role": "assistant", "tool_calls": tool_calls_list})

            for tc in tool_calls_list:
                fn = TOOL_FUNCTIONS.get(tc["function"]["name"])
                if fn is None:
                    result: dict = {"error": f"Unknown tool: {tc['function']['name']}"}
                else:
                    args = json.loads(tc["function"]["arguments"])
                    result = fn(**args)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result),
                    }
                )

            # All tools resolved — signal the UI to clear the indicator.
            yield f"data: [TOOL_DONE]\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: [ERROR] {str(e)}\n\n"
