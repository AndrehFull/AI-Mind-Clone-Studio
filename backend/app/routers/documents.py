"""Knowledge management endpoints.

Port of app/api/personas/[id]/documents/route.ts + .../documents/upload/route.ts.
"""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..schemas import AddTextRequest
from ..services.documents import delete_by_source, list_sources
from ..services.ingest import extract_text, ingest_text
from ..services.personas import get_persona

router = APIRouter(prefix="/personas", tags=["documents"])


@router.get("/{persona_id}/documents")
async def list_docs(persona_id: str):
    """Knowledge sources with chunk counts."""
    sources = await list_sources(persona_id)
    return {"sources": sources}


@router.post("/{persona_id}/documents", status_code=201)
async def add_text(persona_id: str, body: AddTextRequest):
    """Add knowledge from pasted text."""
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")
    if not body.text.strip():
        raise HTTPException(400, "text é obrigatório.")
    source = (body.source or "").strip() or "Texto colado"
    result = await ingest_text(persona_id, body.text, source)
    return {"result": result}


@router.delete("/{persona_id}/documents")
async def remove_source(persona_id: str, source: str | None = None):
    """Remove a whole source (query param ?source=...)."""
    if not source:
        raise HTTPException(400, "source é obrigatório.")
    await delete_by_source(persona_id, source)
    return {"ok": True}


@router.post("/{persona_id}/documents/upload", status_code=201)
async def upload(persona_id: str, file: UploadFile = File(...)):
    """Ingest an uploaded file (multipart)."""
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")

    data = await file.read()
    text = extract_text(data, file.filename or "arquivo", file.content_type)
    if not text.strip():
        raise HTTPException(422, "Não foi possível extrair texto do arquivo.")

    result = await ingest_text(persona_id, text, file.filename or "arquivo")
    return {"result": result}
