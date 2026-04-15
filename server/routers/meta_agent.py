import io

from fastapi import APIRouter, HTTPException, Request, UploadFile
from models import BotConfig, MetaAgentRequest
from services import meta_service
from storage import config_store
from limiter import limiter

router = APIRouter()


@router.post("/meta-agent")
@limiter.limit("20/hour")
async def meta_agent(request: Request, req: MetaAgentRequest) -> dict:
    try:
        result = await meta_service.generate_config(
            req.messages,
            req.document_content,
            req.current_config.model_dump(),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/meta-agent/publish")
async def publish_config(config: BotConfig) -> BotConfig:
    config_store.write_config(config.model_dump())
    return config


@router.post("/upload")
async def upload_document(file: UploadFile) -> dict:
    content = await file.read()

    if file.filename and file.filename.lower().endswith(".pdf"):
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(content))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(
                status_code=422, detail=f"Failed to parse PDF: {str(e)}"
            )
    else:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=422, detail="File must be a PDF or UTF-8 encoded text file"
            )

    return {"content": text}
