import os
from typing import AsyncIterator

from google import genai
from google.genai import types

from prompts.bot_prompt import build_system_prompt
from services.mock_tools import getCardStatus, getTransactionStatus

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))


def get_card_status(application_id: str) -> dict:
    """Get the Atome card application status for a given application ID.

    Args:
        application_id: The unique card application identifier (e.g. APP12345).
    """
    return getCardStatus(application_id)


def get_transaction_status(transaction_id: str) -> dict:
    """Get the status and details of a payment transaction.

    Args:
        transaction_id: The unique transaction identifier (e.g. TXN9999).
    """
    return getTransactionStatus(transaction_id)


TOOL_FUNCTIONS = {
    "getCardStatus": get_card_status,
    "getTransactionStatus": get_transaction_status,
}


async def stream_chat(
    message: str, history: list[dict], config: dict
) -> AsyncIterator[str]:
    system_prompt = build_system_prompt(config)

    enabled_tools = config.get("tools_enabled", [])
    tools = [TOOL_FUNCTIONS[t] for t in enabled_tools if t in TOOL_FUNCTIONS]

    sdk_history = [
        types.Content(
            role="model" if m["role"] == "bot" else "user",
            parts=[types.Part(text=str(m["content"]))],
        )
        for m in history
    ]

    try:
        chat_session = client.aio.chats.create(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools if tools else None,
            ),
            history=sdk_history,
        )

        async for chunk in await chat_session.send_message_stream(message):
            if chunk.text:
                yield f"data: {chunk.text}\n\n"

        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: [ERROR] {str(e)}\n\n"
