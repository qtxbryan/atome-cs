def build_system_prompt(config: dict) -> str:
    parts: list[str] = []

    base_prompt = config.get("system_prompt", "").strip()
    if base_prompt:
        parts.append(base_prompt)
    else:
        parts.append(
            "You are a helpful customer service assistant for Atome Card. "
            "Be friendly, accurate, and concise."
        )

    guidelines = config.get("guidelines", [])
    if guidelines:
        numbered = "\n".join(
            f"{i + 1}. {g}" for i, g in enumerate(guidelines)
        )
        parts.append(f"## Guidelines\n{numbered}")

    kb_content = config.get("kb_content", "").strip()
    if kb_content:
        parts.append(f"## Knowledge Base\n{kb_content}")

    parts.append(
        "## Structured Response Instructions\n"
        "When you call the `get_card_status` tool, respond ONLY with a JSON object:\n"
        '{"type": "card_status", "application_id": "...", "status": "...", '
        '"applied_date": "...", "estimated_days": <int>}\n\n'
        "When you call the `get_transaction_status` tool, respond ONLY with a JSON object:\n"
        '{"type": "transaction_status", "transaction_id": "...", "status": "...", '
        '"amount": <float>, "currency": "PHP", "merchant": "...", "date": "...", '
        '"failure_reason": "..." (only if failed)}\n\n'
        "For all other questions, respond in plain text (no JSON)."
    )

    return "\n\n".join(parts)
