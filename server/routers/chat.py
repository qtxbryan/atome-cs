from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models import ChatRequest
from services import bot_service
from storage import config_store

router = APIRouter()


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    config = config_store.read_config()
    return StreamingResponse(
        bot_service.stream_chat(req.message, req.history, config),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
