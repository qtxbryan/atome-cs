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
        # Phase 1: resolve tool calls (non-streaming) if tools are enabled
        if active_tool_defs:
            while True:
                response = await _get_client().chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=active_tool_defs,
                )
                choice = response.choices[0]

                if choice.finish_reason == "tool_calls":
                    messages.append(choice.message)
                    for tc in choice.message.tool_calls:
                        fn = TOOL_FUNCTIONS.get(tc.function.name)
                        if fn is None:
                            result = {"error": f"Unknown tool: {tc.function.name}"}
                        else:
                            args = json.loads(tc.function.arguments)
                            result = fn(**args)
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps(result),
                            }
                        )
                else:
                    break

        # Phase 2: stream the final answer
        stream = await _get_client().chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield f"data: {delta}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: [ERROR] {str(e)}\n\n"
