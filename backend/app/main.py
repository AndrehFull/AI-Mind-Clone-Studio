"""Mind Clone Studio — FastAPI backend.

Owns the database, OpenAI calls, RAG and the identity layer. The Next frontend
talks to it over HTTP. Error responses use { "error": ... } to match what the
frontend reads (data.error).
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import close_pool, get_pool
from .routers import analyze, chat, documents, personas, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()  # warm the pool / fail fast on a bad DATABASE_URL
    yield
    await close_pool()


app = FastAPI(title="Mind Clone Studio API", lifespan=lifespan)

# Local/self-hosted tool: allow any origin by default so the browser can reach
# the API whether it's served from localhost, 127.0.0.1 or a LAN IP. Set
# WEB_ORIGIN to a specific origin to lock it down (then credentials are allowed).
_allow_all = settings.web_origin == "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else [settings.web_origin],
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- error contract: always { "error": "..." } -----------------------------
@app.exception_handler(HTTPException)
async def http_exc_handler(_req: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exc_handler(_req: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": exc.errors()[0]["msg"] if exc.errors() else "Dados inválidos."})


@app.exception_handler(Exception)
async def unhandled_exc_handler(_req: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/health")
async def health():
    return {"ok": True}


for r in (personas, chat, analyze, profile, documents):
    app.include_router(r.router)
