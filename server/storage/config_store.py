import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

DEFAULT_CONFIG = {
    "kb_url": "",
    "kb_content": "",
    "system_prompt": "You are a helpful customer service assistant for Atome Card. Be friendly, accurate, and concise.",
    "guidelines": [
        "Always greet the customer warmly and address them by name if provided.",
        "Ask for an application ID or transaction ID before checking status.",
        "If you cannot find an answer in the knowledge base, say so honestly instead of guessing.",
        "Keep responses concise - aim for 3-5 sentences unless more detail is explicitly requested.",
    ],
    "tools_enabled": ["getCardStatus", "getTransactionStatus"],
}


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_config() -> dict:
    _ensure_data_dir()
    config_path = DATA_DIR / "config.json"
    if not config_path.exists():
        write_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_config(data: dict) -> None:
    _ensure_data_dir()
    config_path = DATA_DIR / "config.json"
    tmp_path = DATA_DIR / "config.json.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp_path.replace(config_path)
