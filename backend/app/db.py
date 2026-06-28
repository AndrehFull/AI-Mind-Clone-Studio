"""Single shared asyncpg pool (pgvector-enabled).

Port of lib/db.ts. Works with a local Docker Postgres or a Supabase
direct-connection string. JSON/JSONB columns are decoded to Python objects.
"""
from __future__ import annotations

import json
import re
import ssl
from typing import Any

import asyncpg

from .config import settings

_pool: asyncpg.Pool | None = None


def _ssl_for(dsn: str) -> ssl.SSLContext | None:
    """Supabase requires SSL; local Docker does not. Enable SSL when the URL
    isn't pointing at localhost (mirrors lib/db.ts, rejectUnauthorized: false)."""
    if re.search(r"localhost|127\.0\.0\.1|@db:", dsn):
        return None
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def _init_conn(conn: asyncpg.Connection) -> None:
    # Decode json/jsonb to Python objects and encode Python objects back.
    for typename in ("json", "jsonb"):
        await conn.set_type_codec(
            typename,
            encoder=json.dumps,
            decoder=json.loads,
            schema="pg_catalog",
        )


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            ssl=_ssl_for(settings.database_url),
            init=_init_conn,
            min_size=1,
            max_size=10,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def query(text: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
    """Run a query and return rows as dicts."""
    pool = await get_pool()
    rows = await pool.fetch(text, *(params or []))
    return [dict(r) for r in rows]


async def query_one(text: str, params: list[Any] | None = None) -> dict[str, Any] | None:
    """Run a query expecting at most one row."""
    rows = await query(text, params)
    return rows[0] if rows else None


def to_vector_literal(embedding: list[float]) -> str:
    """Format an embedding into the pgvector text literal `[a,b,c]`."""
    return "[" + ",".join(str(x) for x in embedding) + "]"
