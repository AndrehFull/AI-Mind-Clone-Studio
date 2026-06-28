"""Persona CRUD endpoints. Port of app/api/personas/route.ts + [id]/route.ts."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from ..schemas import PersonaCreate, PersonaPatch
from ..services import personas as svc

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("")
async def list_personas():
    """List all personas with their knowledge chunk counts."""
    rows = await svc.list_personas()
    counts = await asyncio.gather(*(svc.count_documents(p["id"]) for p in rows))
    return {"personas": [{**p, "document_count": c} for p, c in zip(rows, counts)]}


@router.post("", status_code=201)
async def create_persona(body: PersonaCreate):
    """Create a persona."""
    if not body.name.strip() or not body.system_prompt.strip():
        raise HTTPException(400, "name e system_prompt são obrigatórios.")
    if not body.consent_ack:
        raise HTTPException(400, "É necessário confirmar o consentimento para criar uma persona.")
    persona = await svc.create_persona(body.model_dump())
    return {"persona": persona}


@router.get("/{persona_id}")
async def get_persona(persona_id: str):
    persona = await svc.get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")
    document_count = await svc.count_documents(persona["id"])
    return {"persona": {**persona, "document_count": document_count}}


@router.patch("/{persona_id}")
async def patch_persona(persona_id: str, body: PersonaPatch):
    # Profile fields are written only through the dedicated /profile route
    # (validation + optimistic locking). PersonaPatch already excludes them.
    patch = body.model_dump(exclude_unset=True)
    persona = await svc.update_persona(persona_id, patch)
    return {"persona": persona}


@router.delete("/{persona_id}")
async def delete_persona(persona_id: str):
    """Cascades to its documents."""
    await svc.delete_persona(persona_id)
    return {"ok": True}
