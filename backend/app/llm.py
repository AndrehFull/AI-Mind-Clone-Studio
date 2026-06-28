"""OpenAI wrappers (embeddings + chat). Port of lib/openai.ts.

Async client; chat_stream yields text deltas as they arrive.
"""
from __future__ import annotations

import json
from typing import Any, AsyncGenerator

from openai import AsyncOpenAI

from .config import settings

# Max characters fed to the embedding model (guards the token limit).
MAX_EMBED_CHARS = 7500

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def embed(text: str) -> list[float]:
    """Embed a single piece of text. Returns a 3072-dim vector."""
    res = await get_client().embeddings.create(
        model=settings.openai_embed_model,
        input=text[:MAX_EMBED_CHARS],
    )
    return res.data[0].embedding


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed many texts in one call (used by ingestion). Preserves order."""
    if not texts:
        return []
    res = await get_client().embeddings.create(
        model=settings.openai_embed_model,
        input=[t[:MAX_EMBED_CHARS] for t in texts],
    )
    return [d.embedding for d in sorted(res.data, key=lambda d: d.index)]


async def chat(messages: list[dict[str, Any]]) -> str:
    """Non-streaming chat completion."""
    res = await get_client().chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,
    )
    return res.choices[0].message.content or ""


async def chat_json(messages: list[dict[str, Any]], temperature: float | None = None) -> Any:
    """Chat completion forced to return a JSON object. Returns the parsed value.

    Pass temperature=0 for deterministic extraction (e.g. profile distillation).
    """
    kwargs: dict[str, Any] = {
        "model": settings.openai_chat_model,
        "messages": messages,
        "response_format": {"type": "json_object"},
    }
    if temperature is not None:
        kwargs["temperature"] = temperature
    res = await get_client().chat.completions.create(**kwargs)
    content = res.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("O modelo retornou um JSON inválido.") from exc


async def chat_stream(messages: list[dict[str, Any]]) -> AsyncGenerator[str, None]:
    """Streaming chat completion. Yields text deltas as they arrive."""
    stream = await get_client().chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta
