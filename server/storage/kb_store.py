from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
KB_FILE = DATA_DIR / "kb_content.md"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_kb() -> str:
    _ensure_data_dir()
    if not KB_FILE.exists():
        return ""
    return KB_FILE.read_text(encoding="utf-8")


def write_kb(content: str) -> None:
    _ensure_data_dir()
    tmp = DATA_DIR / "kb_content.md.tmp"
    tmp.write_text(content, encoding="utf-8")
    tmp.replace(KB_FILE)
