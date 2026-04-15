from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from models import ChatRequest
from services import bot_service
from storage import config_store, kb_store
from limiter import limiter

router = APIRouter()


@router.post("/chat")
@limiter.limit("30/hour")
async def chat(
    request: Request,
    req: ChatRequest,
) -> StreamingResponse:
    config = config_store.read_config()
    config["kb_content"] = kb_store.read_kb()
    return StreamingResponse(
        bot_service.stream_chat(req.message, req.history, config),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
