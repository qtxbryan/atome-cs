import logging
import os

from openai import AsyncOpenAI
from pydantic import BaseModel

from prompts.fix_prompt import FIX_SYSTEM_PROMPT
from storage import config_store, mistakes_store

MODEL = "gpt-5-nano"

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


class FixSuggestion(BaseModel):
    guideline_index: int
    before: str | None = None
    after: str
    explanation: str | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


async def generate_fix(mistake_id: str) -> None:
    try:
        data = mistakes_store.read_mistakes()
        location = mistakes_store.find_mistake_by_id(data, mistake_id)
        if location is None:
            logger.warning("generate_fix: mistake %s not found", mistake_id)
            return

        bucket, idx = location
        mistake = data[bucket][idx]

        config = config_store.read_config()
        guidelines = config.get("guidelines", [])

        if not guidelines:
            mistakes_store.update_mistake_in_store(
                mistake_id,
                {"fix_generating": False, "fix_diff": None},
            )
            return

        numbered_guidelines = "\n".join(
            f"{i}. {g}" for i, g in enumerate(guidelines)
        )

        history_lines = "\n".join(
            f"{m['role'].upper()}: {m['content']}"
            for m in mistake.get("conversation_history", [])
        )
        history_section = (
            f"Conversation history:\n{history_lines}\n\n" if history_lines else ""
        )

        prompt_text = (
            f"{history_section}"
            f"Complaint type: {mistake.get('complaint_type', 'other')}\n"
            f"Customer message: {mistake.get('customer_message', '')}\n"
            f"Bot response: {mistake.get('bot_response', '')}\n"
            f"Customer comment: {mistake.get('comment', '')}\n\n"
            f"Current guidelines (zero-based index):\n{numbered_guidelines}"
        )

        response = await _get_client().responses.parse(
            model=MODEL,
            instructions=FIX_SYSTEM_PROMPT,
            input=[
                {
                    "role": "user",
                    "content": prompt_text,
                }
            ],
            text_format=FixSuggestion,
        )

        parsed = response.output_parsed
        if not isinstance(parsed, FixSuggestion):
            raise ValueError("Model did not return a valid fix suggestion.")

        guideline_index = int(parsed.guideline_index)
        if not (0 <= guideline_index < len(guidelines)):
            guideline_index = 0

        fix_diff = {
            "guideline_index": guideline_index,
            "before": parsed.before or guidelines[guideline_index],
            "after": parsed.after,
            "explanation": parsed.explanation or "",
        }

        mistakes_store.update_mistake_in_store(
            mistake_id,
            {"fix_generating": False, "fix_diff": fix_diff},
        )

    except Exception as e:
        logger.error("generate_fix failed for %s: %s", mistake_id, e)
        mistakes_store.update_mistake_in_store(
            mistake_id,
            {"fix_generating": False, "fix_diff": None},
        )
