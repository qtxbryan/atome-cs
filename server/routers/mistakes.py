import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException
from models import ApplyFixRequest, Mistake, MistakesStore, ReportMistakeRequest
from storage import config_store, mistakes_store
from services import fix_service

router = APIRouter()


@router.get("/mistakes", response_model=MistakesStore)
async def get_mistakes() -> MistakesStore:
    data = mistakes_store.read_mistakes()
    return MistakesStore(**data)


@router.get("/mistakes/{mistake_id}", response_model=Mistake)
async def get_mistake(mistake_id: str) -> Mistake:
    data = mistakes_store.read_mistakes()
    location = mistakes_store.find_mistake_by_id(data, mistake_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Mistake not found")
    bucket, idx = location
    return Mistake(**data[bucket][idx])


@router.post("/mistakes", response_model=Mistake, status_code=201)
async def report_mistake(
    req: ReportMistakeRequest, background_tasks: BackgroundTasks
) -> Mistake:
    mistake_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    mistake = Mistake(
        id=mistake_id,
        timestamp=now,
        customer_message=req.customer_message,
        bot_response=req.bot_response,
        complaint_type=req.complaint_type,
        comment=req.comment,
        status="pending_review",
        fix_generating=True,
        conversation_history=req.conversation_history,
    )
    data = mistakes_store.read_mistakes()
    data["pending_review"].append(mistake.model_dump())
    mistakes_store.write_mistakes(data)

    background_tasks.add_task(fix_service.generate_fix, mistake_id)

    return mistake


@router.put("/mistakes/{mistake_id}/apply", response_model=Mistake)
async def apply_fix(mistake_id: str, req: ApplyFixRequest) -> Mistake:
    data = mistakes_store.read_mistakes()
    location = mistakes_store.find_mistake_by_id(data, mistake_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Mistake not found")

    bucket, idx = location
    mistake_data = data[bucket][idx]

    if mistake_data.get("fix_generating") is True:
        raise HTTPException(
            status_code=422,
            detail="Fix is still being generated, please wait before applying",
        )

    fix_diff = mistake_data.get("fix_diff")
    if req.edited_after is None and fix_diff is None:
        raise HTTPException(status_code=422, detail="No fix available to apply")

    final_text = req.edited_after if req.edited_after is not None else fix_diff["after"]

    config = config_store.read_config()
    if fix_diff is not None:
        guideline_idx = fix_diff["guideline_index"]
        guidelines = config.get("guidelines", [])
        if 0 <= guideline_idx < len(guidelines):
            guidelines[guideline_idx] = final_text
            config["guidelines"] = guidelines
            config_store.write_config(config)

    if bucket != "pending_review":
        data[bucket].pop(idx)
    else:
        data["pending_review"].pop(idx)

    mistake_data["status"] = "applied"
    if fix_diff:
        mistake_data["fix_diff"]["after"] = final_text
    data["applied"].append(mistake_data)
    mistakes_store.write_mistakes(data)

    return Mistake(**mistake_data)


@router.put("/mistakes/{mistake_id}/dismiss", response_model=Mistake)
async def dismiss_mistake(mistake_id: str) -> Mistake:
    data = mistakes_store.read_mistakes()
    location = mistakes_store.find_mistake_by_id(data, mistake_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Mistake not found")

    bucket, idx = location
    mistake_data = data[bucket].pop(idx)
    mistake_data["status"] = "dismissed"
    data["dismissed"].append(mistake_data)
    mistakes_store.write_mistakes(data)

    return Mistake(**mistake_data)
