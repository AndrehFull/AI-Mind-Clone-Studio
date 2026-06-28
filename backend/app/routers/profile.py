"""Profile approve/discard + distillation.

Port of app/api/personas/[id]/profile/route.ts and .../profile/distill/route.ts.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from ..schemas import DistillRequest, ProfilePatchRequest
from ..services.personas import get_persona, update_persona
from ..services.profile import compute_diff, distill_profile, validate_profile

router = APIRouter(prefix="/personas", tags=["profile"])


def _iso(v: Any) -> Any:
    """Normalise a timestamptz to the same ISO string the frontend received."""
    return v.isoformat() if hasattr(v, "isoformat") else v


@router.patch("/{persona_id}/profile")
async def approve_profile(persona_id: str, body: ProfilePatchRequest):
    """Approve a profile: save it, record provenance, clear the draft.

    The ONLY writer of the approved profile. Optimistic locking via
    profile_updated_at (409 if it changed since the client loaded it).
    """
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")
    if not body.profile:
        raise HTTPException(400, "profile é obrigatório.")

    # Optimistic lock: reject if someone else approved a profile meanwhile.
    if _iso(persona.get("profile_updated_at")) != body.profile_updated_at:
        raise HTTPException(409, "O perfil mudou desde que você abriu. Recarregue e revise novamente.")

    # Human-approved edits do not need a separate evidence quote.
    profile = validate_profile(
        body.profile,
        require_evidence=False,
        archetype=(persona.get("profile") or {}).get("archetype"),
    )

    updated = await update_persona(
        persona_id,
        {"profile": profile, "profile_meta": body.profile_meta, "profile_draft": None},
    )
    return {"persona": updated}


@router.delete("/{persona_id}/profile")
async def discard_draft(persona_id: str):
    """Discard the pending draft proposal."""
    updated = await update_persona(persona_id, {"profile_draft": None})
    return {"persona": updated}


@router.post("/{persona_id}/profile/distill")
async def distill(persona_id: str, body: DistillRequest):
    """Distil a profile proposal, save it as the draft, return it with a diff
    against the current approved profile. Does NOT change the approved profile."""
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")

    answers = [a.model_dump() for a in body.answers] if body.answers else None
    proposed = await distill_profile(
        persona_id=persona_id,
        source=body.source,
        answers=answers,
        archetype=body.archetype,
        language=body.language,
    )

    diff = compute_diff(persona.get("profile"), proposed, persona.get("profile_meta"))
    await update_persona(persona_id, {"profile_draft": proposed})

    return {"proposed": proposed, "diff": diff}
