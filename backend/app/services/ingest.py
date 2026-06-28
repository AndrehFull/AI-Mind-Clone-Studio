"""Chunk -> embed -> store knowledge, and file text extraction. Port of lib/ingest.ts."""
from __future__ import annotations

from typing import Any

from ..db import query, to_vector_literal
from ..llm import embed_batch
from .chunking import chunk_text

# OpenAI's embeddings endpoint accepts a bounded batch size.
EMBED_BATCH = 96


async def ingest_text(
    persona_id: str,
    text: str,
    source: str,
    extra_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Chunk -> embed -> store a piece of text as knowledge for a persona.

    `source` is recorded in each chunk's metadata for traceability.
    """
    extra_metadata = extra_metadata or {}
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=200)
    if not chunks:
        return {"source": source, "chunks": 0}

    for i in range(0, len(chunks), EMBED_BATCH):
        batch = chunks[i : i + EMBED_BATCH]
        embeddings = await embed_batch(batch)

        values_sql: list[str] = []
        params: list[Any] = []
        for j, content in enumerate(batch):
            base = len(params)
            metadata = {"source": source, "chunk_index": i + j, **extra_metadata}
            params.extend([persona_id, content, to_vector_literal(embeddings[j]), metadata])
            values_sql.append(
                f"(${base + 1}::uuid, ${base + 2}, ${base + 3}::vector, ${base + 4}::jsonb)"
            )

        await query(
            "insert into documents (persona_id, content, embedding, metadata) values "
            + ", ".join(values_sql),
            params,
        )

    return {"source": source, "chunks": len(chunks)}


def extract_text(data: bytes, file_name: str, mime_type: str | None = None) -> str:
    """Extract plain text from an uploaded file based on its type/name.

    PDFs go through pypdf (text layer). OCR for scanned PDFs is a follow-on
    (ocrmypdf/pytesseract) and would hook in here. Everything else is UTF-8.
    """
    lower = file_name.lower()
    is_pdf = mime_type == "application/pdf" or lower.endswith(".pdf")

    if is_pdf:
        import io

        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    # Treat everything else (.txt, .md, .csv, .json, ...) as UTF-8 text.
    return data.decode("utf-8", errors="replace")
