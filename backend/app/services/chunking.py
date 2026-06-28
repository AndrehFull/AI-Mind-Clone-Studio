"""Lightweight recursive character text splitter. Port of lib/chunk.ts.

Mirrors the n8n pipeline (chunk ~1000, overlap ~200): split on the largest
natural separator that keeps chunks under chunk_size, falling back to
ever-smaller separators, then stitch overlap between chunks.
"""
from __future__ import annotations

SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


def _split_recursive(text: str, chunk_size: int, seps: list[str]) -> list[str]:
    if len(text) <= chunk_size:
        return [text]

    sep = seps[0] if seps else None
    rest = seps[1:]

    # No separators left: hard-split by size.
    if sep is None:
        return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]

    parts = list(text) if sep == "" else text.split(sep)
    chunks: list[str] = []
    current = ""

    for part in parts:
        candidate = current + sep + part if current else part
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # The part itself is too big — recurse with a finer separator.
            if len(part) > chunk_size:
                chunks.extend(_split_recursive(part, chunk_size, rest))
                current = ""
            else:
                current = part
    if current:
        chunks.append(current)
    return chunks


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    normalized = text.replace("\r\n", "\n").strip()
    if not normalized:
        return []

    raw = [c.strip() for c in _split_recursive(normalized, chunk_size, SEPARATORS)]
    raw = [c for c in raw if c]

    if chunk_overlap <= 0 or len(raw) <= 1:
        return raw

    # Prepend a tail of the previous chunk to each chunk for context overlap.
    out: list[str] = []
    for i, chunk in enumerate(raw):
        if i == 0:
            out.append(chunk)
        else:
            prev_tail = raw[i - 1][-chunk_overlap:]
            out.append(f"{prev_tail} {chunk}".strip())
    return out
