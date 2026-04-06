import json
import os

from fastapi import HTTPException
from openai import AsyncOpenAI

from models import BotConfig
from prompts.meta_prompt import META_SYSTEM_PROMPT

MODEL = "gpt-5-nano"

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


async def generate_config(
    messages: list, document_content: str | None, current_config: dict
) -> dict:
    context_parts: list[str] = []

    context_parts.append(
        f"Current bot configuration (for reference):\n{json.dumps(current_config, indent=2)}"
    )

    if document_content and document_content.strip():
        context_parts.append(
            f"Uploaded document content:\n{document_content[:8000]}"
        )

    if messages:
        conversation = "\n".join(
            f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
            for m in messages
        )
        context_parts.append(f"Manager conversation:\n{conversation}")

    prompt_text = "\n\n---\n\n".join(context_parts)

    try:
        response = await _get_client().chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": META_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_text},
            ],
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content or ""
        parsed = json.loads(raw_json)
        validated = BotConfig.model_validate(parsed)
        return validated.model_dump()
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Meta-agent returned invalid JSON: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Meta-agent returned invalid config: {str(e)}",
        )
