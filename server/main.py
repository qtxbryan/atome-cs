import asyncio
import os
import sys

# Playwright spawns a subprocess to launch Chromium. On Windows the default
# SelectorEventLoop does not support subprocesses — ProactorEventLoop does.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routers import chat, config, kb, meta_agent, mistakes
from limiter import limiter

app = FastAPI(title="Atome Card Support API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost")
_allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(kb.router, prefix="/api")
app.include_router(mistakes.router, prefix="/api")
app.include_router(meta_agent.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
