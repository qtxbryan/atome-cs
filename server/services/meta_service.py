import json
import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from models import BotConfig
from prompts.meta_prompt import CONVERSATION_SYSTEM_PROMPT, CONFIG_SYSTEM_PROMPT

MODEL = os.environ.get("META_MODEL", "gpt-4o-mini")

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


async def stream_generate(
    messages: list,
    document_content: str | None,
    current_config: dict,
) -> AsyncIterator[str]:
    """Stream a conversational reply only. Config generation is a separate explicit action."""
    client = _get_client()
    system_ctx = _build_system_context(document_content, current_config)

    chat_messages: list[dict] = [{"role": "system", "content": system_ctx}]
    for m in messages:
        role = m.get("role", "user")
        if role in ("user", "assistant"):
            chat_messages.append({"role": role, "content": m.get("content", "")})

    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=chat_messages,
            stream=True,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield f"event: text\ndata: {json.dumps(token)}\n\n"
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

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": CONFIG_SYSTEM_PROMPT},
            {"role": "user", "content": "\n\n---\n\n".join(context_parts)},
        ],
        response_format={"type": "json_object"},
    )
    raw_json = response.choices[0].message.content or "{}"
    parsed = json.loads(raw_json)
    validated = BotConfig.model_validate(parsed)
    return validated.model_dump()
