"""Knowledge document/source queries. Port of lib/documents.ts."""
from __future__ import annotations

from typing import Any

from ..db import query


async def list_documents(persona_id: str, limit: int = 200) -> list[dict[str, Any]]:
    """List knowledge chunks for a persona."""
    return await query(
        """select id::int as id, persona_id, content, metadata, created_at
             from documents
            where persona_id = $1::uuid
            order by id asc
            limit $2""",
        [persona_id, limit],
    )


async def delete_document(persona_id: str, doc_id: int) -> None:
    """Delete a single chunk (must belong to the persona)."""
    await query("delete from documents where persona_id = $1::uuid and id = $2", [persona_id, doc_id])


async def delete_by_source(persona_id: str, source: str) -> None:
    """Delete every chunk for a given source (used to 'remove a document')."""
    await query(
        "delete from documents where persona_id = $1::uuid and metadata->>'source' = $2",
        [persona_id, source],
    )


async def list_sources(persona_id: str) -> list[dict[str, Any]]:
    """Group chunks by their `source` metadata for a document-level listing."""
    rows = await query(
        """select coalesce(metadata->>'source', 'desconhecido') as source,
                  count(*)::int as chunks
             from documents
            where persona_id = $1::uuid
            group by 1
            order by 1""",
        [persona_id],
    )
    return [{"source": r["source"], "chunks": int(r["chunks"])} for r in rows]
