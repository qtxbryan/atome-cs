def build_system_prompt(config: dict) -> str:
    parts: list[str] = []
    
    base_prompt = config.get("system_prompt", "").strip()
    
    if base_prompt:
        parts.append(base_prompt)
    else:
        parts.append(
            "You are a helpful customer service assistant for Atome. "
            "Be friendly, accurate, and concise."
        )
    
    guidelines = config.get("guidelines", [])
    if guidelines:
        numbered = "\n".join(f"{i + 1}. {g}" for i, g in enumerate(guidelines))
        parts.append(f"##Guidelines\n{numbered}")
    
    kb_content = config.get("kb_content", "").strip()
    if kb_content:
        parts.append(f"## Knowledge Base\n{kb_content}")
        
    return "\n\n".join(parts)
    
