from typing import Literal
from pydantic import BaseModel, ConfigDict

ComplaintType = Literal["wrong_info", "didnt_understand", "missing_info", "other"]
MistakeStatus = Literal["pending_review", "applied", "dismissed"]


class FixDiff(BaseModel):
    guideline_index: int
    before: str
    after: str
    explanation: str


class Mistake(BaseModel):
    id: str
    timestamp: str
    customer_message: str
    bot_response: str
    complaint_type: ComplaintType
    comment: str
    status: MistakeStatus
    fix_diff: FixDiff | None = None
    fix_generating: bool = False
    conversation_history: list[dict] = []


class MistakesStore(BaseModel):
    pending_review: list[Mistake] = []
    applied: list[Mistake] = []
    dismissed: list[Mistake] = []


class BotConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kb_url: str = ""
    kb_scraped_at: str | None = None
    kb_pages_scraped: int = 0
    system_prompt: str = ""
    guidelines: list[str] = []
    tools_enabled: list[str] = ["getCardStatus", "getTransactionStatus"]


class ChatRequest(BaseModel):
    message: str
    history: list[dict]


class ReportMistakeRequest(BaseModel):
    customer_message: str
    bot_response: str
    complaint_type: ComplaintType
    comment: str = ""
    conversation_history: list[dict] = []


class ApplyFixRequest(BaseModel):
    edited_after: str | None = None


class MetaAgentRequest(BaseModel):
    messages: list[dict]
    document_content: str | None = None
    current_config: BotConfig


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    pages_scraped: int
    scraped_at: str


class KbContentResponse(BaseModel):
    content: str


class KbSaveRequest(BaseModel):
    content: str
