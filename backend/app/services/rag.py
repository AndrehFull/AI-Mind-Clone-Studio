"""Retrieval-augmented context. Port of lib/rag.ts."""
from __future__ import annotations

import re
from typing import Any

from ..db import query, to_vector_literal
from ..llm import embed


def extract_urls(text: str) -> list[str]:
    """Extract http(s) URLs cited in a text."""
    return re.findall(r"https?://[^\s)]+", text)


async def retrieve_chunks(persona_id: str, text: str, match_count: int = 8) -> list[dict[str, Any]]:
    """Retrieve the most relevant knowledge chunks for `text` within a persona's
    knowledge base, via the `match_documents` Postgres function."""
    if not text.strip():
        return []
    embedding = await embed(text)
    return await query(
        """select id::int as id, content, metadata, similarity
             from match_documents($1::vector, $2, $3::uuid)""",
        [to_vector_literal(embedding), match_count, persona_id],
    )


def format_context(chunks: list[dict[str, Any]]) -> str:
    """Format retrieved chunks into a context block for the model prompt."""
    if not chunks:
        return "(Nenhum material de conhecimento encontrado para esta persona.)"
    blocks = []
    for i, c in enumerate(chunks):
        source = (c.get("metadata") or {}).get("source") or f"chunk {c['id']}"
        blocks.append(
            f"[Trecho {i + 1} | fonte: {source} | score: {c['similarity']:.3f}]\n{c['content']}"
        )
    return "\n\n".join(blocks)


async def build_context(persona_id: str, text: str, match_count: int = 8) -> str:
    """Convenience: retrieve + format in one call."""
    chunks = await retrieve_chunks(persona_id, text, match_count)
    return format_context(chunks)
