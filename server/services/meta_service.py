import json
import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from models import BotConfig
from prompts.meta_prompt import CONVERSATION_SYSTEM_PROMPT, CONFIG_SYSTEM_PROMPT

MODEL = os.environ.get("META_MODEL", "gpt-5-nano")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def _build_system_context(document_content: str | None, current_config: dict) -> str:
    parts = [CONVERSATION_SYSTEM_PROMPT]
    parts.append(f"Current bot configuration:\n{json.dumps(current_config, indent=2)}")
    if document_content and document_content.strip():
        parts.append(f"Uploaded document (for reference):\n{document_content[:8000]}")
    return "\n\n---\n\n".join(parts)


def _build_input_messages(messages: list) -> list[dict]:
    input_messages: list[dict] = []
    for m in messages:
        role = m.get("role", "user")
        if role in ("user", "assistant"):
            input_messages.append({"role": role, "content": m.get("content", "")})
    return input_messages


def _require_parsed_output(response: BotConfig | object, fallback: str) -> BotConfig:
    if isinstance(response, BotConfig):
        return response
    raise ValueError(fallback)


async def stream_generate(
    messages: list,
    document_content: str | None,
    current_config: dict,
) -> AsyncIterator[str]:
    """Stream a conversational reply only. Config generation is a separate explicit action."""
    client = _get_client()
    system_ctx = _build_system_context(document_content, current_config)
    input_messages = _build_input_messages(messages)

    try:
        stream = await client.responses.create(
            model=MODEL,
            instructions=system_ctx,
            input=input_messages,
            stream=True,
        )
        async for event in stream:
            if event.type == "response.output_text.delta" and event.delta:
                yield f"event: text\ndata: {json.dumps(event.delta)}\n\n"
    except Exception as e:
        yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
        return

    yield "event: done\ndata: \n\n"


async def generate_config(
    messages: list,
    document_content: str | None,
    current_config: dict,
) -> dict:
    """Generate a bot config JSON from the full conversation history. Called explicitly."""
    client = _get_client()

    conversation_text = "\n".join(
        f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
        for m in messages
    )
    context_parts = [f"Current config:\n{json.dumps(current_config, indent=2)}"]
    if document_content and document_content.strip():
        context_parts.append(f"Uploaded document:\n{document_content[:8000]}")
    context_parts.append(f"Conversation:\n{conversation_text}")

    response = await client.responses.parse(
        model=MODEL,
        instructions=CONFIG_SYSTEM_PROMPT,
        input=[
            {
                "role": "user",
                "content": "\n\n---\n\n".join(context_parts),
            }
        ],
        text_format=BotConfig,
    )
    parsed = _require_parsed_output(
        response.output_parsed,
        "Model did not return a valid bot configuration.",
    )
    return parsed.model_dump()
