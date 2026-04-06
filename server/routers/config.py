from fastapi import APIRouter
from models import BotConfig, FetchKbRequest, FetchKbResponse
from services import kb_service
from storage import config_store

router = APIRouter()


@router.get("/config", response_model=BotConfig)
async def get_config() -> BotConfig:
    data = config_store.read_config()
    return BotConfig(**data)


@router.put("/config", response_model=BotConfig)
async def update_config(config: BotConfig) -> BotConfig:
    existing = config_store.read_config()
    data = config.model_dump()

    new_url = data.get("kb_url", "").strip()
    old_url = existing.get("kb_url", "").strip()

    if new_url and new_url != old_url:
        content, _ = await kb_service.crawl_knowledge_base(new_url)
        data["kb_content"] = content

    config_store.write_config(data)
    return BotConfig(**data)


@router.post("/config/fetch-kb", response_model=FetchKbResponse)
async def fetch_kb(req: FetchKbRequest) -> FetchKbResponse:
    content, article_count = await kb_service.crawl_knowledge_base(req.url)
    return FetchKbResponse(content=content, article_count=article_count)
