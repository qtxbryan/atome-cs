# Atome Card Support Bot

A customer service bot management system with two roles:
- **Customer** — chats with the bot at `/`
- **Manager** — configures the bot at `/manager` (password: `atome2024`)

## Quick Start (Docker)

```bash
# 1. Copy env and fill in your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# 2. Start everything
docker compose up --build

# 3. Open in browser
# Customer: http://localhost:5173
# Manager:  http://localhost:5173/manager
```

## Local Development

### Backend

```bash
cd server
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Notes

- The `server/data/` directory and its JSON files (`config.json`, `mistakes.json`) are **auto-created on first run** — no manual data setup is needed after cloning.
- All LLM calls use the Gemini API (`gemini-2.0-flash`). Set `GEMINI_API_KEY` in `.env` before running.
- `data/*.json` is gitignored — runtime state is not committed.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4 |
| Backend | Python 3.11 + FastAPI |
| LLM | Gemini API (google-genai SDK) |
| Persistence | JSON files only |
| Deployment | Docker + docker-compose |
