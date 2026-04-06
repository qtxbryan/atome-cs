from datetime import datetime, timezone

from fastapi import APIRouter
from models import KbContentResponse, KbSaveRequest, ScrapeRequest, ScrapeResponse
from services import scraper_service
from storage import config_store, kb_store

router = APIRouter()


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_kb(req: ScrapeRequest) -> ScrapeResponse:
    markdown, article_count = await scraper_service.scrape(req.url)
    kb_store.write_kb(markdown)
    scraped_at = datetime.now(timezone.utc).isoformat()
    config_store.update_kb_meta(req.url, scraped_at, article_count)
    return ScrapeResponse(pages_scraped=article_count, scraped_at=scraped_at)


@router.get("/kb", response_model=KbContentResponse)
async def get_kb() -> KbContentResponse:
    return KbContentResponse(content=kb_store.read_kb())


@router.put("/kb")
async def save_kb(req: KbSaveRequest) -> dict:
    kb_store.write_kb(req.content)
    return {"ok": True}
