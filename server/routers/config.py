from fastapi import APIRouter
from models import BotConfig
from storage import config_store

router = APIRouter()


@router.get("/config", response_model=BotConfig)
async def get_config() -> BotConfig:
    data = config_store.read_config()
    return BotConfig(**data)


@router.put("/config", response_model=BotConfig)
async def update_config(config: BotConfig) -> BotConfig:
    data = config.model_dump()
    config_store.write_config(data)
    return BotConfig(**data)
