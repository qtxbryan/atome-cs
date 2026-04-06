from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, config, meta_agent, mistakes

app = FastAPI(title="Atome Card Support API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(mistakes.router, prefix="/api")
app.include_router(meta_agent.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
