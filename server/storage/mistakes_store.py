import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

DEFAULT_MISTAKES: dict = {"pending_review": [], "applied": [], "dismissed": []}

BUCKETS = ["pending_review", "applied", "dismissed"]


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_mistakes() -> dict:
    _ensure_data_dir()
    mistakes_path = DATA_DIR / "mistakes.json"
    if not mistakes_path.exists():
        write_mistakes(DEFAULT_MISTAKES)
        return {"pending_review": [], "applied": [], "dismissed": []}
    with open(mistakes_path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_mistakes(data: dict) -> None:
    _ensure_data_dir()
    mistakes_path = DATA_DIR / "mistakes.json"
    tmp_path = DATA_DIR / "mistakes.json.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp_path.replace(mistakes_path)


def find_mistake_by_id(data: dict, mistake_id: str) -> tuple[str, int] | None:
    for bucket in BUCKETS:
        for i, m in enumerate(data.get(bucket, [])):
            if m.get("id") == mistake_id:
                return (bucket, i)
    return None


def update_mistake_in_store(mistake_id: str, updates: dict) -> dict | None:
    data = read_mistakes()
    location = find_mistake_by_id(data, mistake_id)
    if location is None:
        return None
    bucket, idx = location
    data[bucket][idx].update(updates)
    write_mistakes(data)
    return data[bucket][idx]
