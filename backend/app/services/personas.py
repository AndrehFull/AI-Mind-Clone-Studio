"""Persona CRUD. Port of lib/personas.ts."""
from __future__ import annotations

import re
import unicodedata
from typing import Any

from ..db import query, query_one

COLS = """id, slug, name, title, description, avatar_url,
  system_prompt, analysis_prompt, analysis_schema,
  profile, profile_draft, profile_meta, profile_updated_at, consent_ack,
  created_at, updated_at"""


def slugify(name: str) -> str:
    """Build a url-friendly slug from a name."""
    nfkd = unicodedata.normalize("NFD", name.lower())
    no_accents = "".join(c for c in nfkd if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", no_accents)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug[:60]


async def list_personas() -> list[dict[str, Any]]:
    return await query(f"select {COLS} from personas order by created_at asc")


async def get_persona(persona_id: str) -> dict[str, Any] | None:
    return await query_one(f"select {COLS} from personas where id = $1::uuid", [persona_id])


async def _unique_slug(base: str) -> str:
    """Ensure a slug is unique by appending -2, -3, ... when needed."""
    root = base or "persona"
    slug = root
    n = 1
    while True:
        existing = await query_one("select 1 from personas where slug = $1", [slug])
        if not existing:
            return slug
        n += 1
        slug = f"{root}-{n}"


async def create_persona(data: dict[str, Any]) -> dict[str, Any]:
    slug = await _unique_slug(slugify(data["name"]))
    row = await query_one(
        f"""insert into personas
              (slug, name, title, description, avatar_url, system_prompt, analysis_prompt, analysis_schema,
               profile, profile_meta, consent_ack)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            returning {COLS}""",
        [
            slug,
            data["name"],
            data.get("title"),
            data.get("description"),
            data.get("avatar_url"),
            data["system_prompt"],
            data.get("analysis_prompt"),
            data.get("analysis_schema"),
            data.get("profile"),
            data.get("profile_meta"),
            data.get("consent_ack", False),
        ],
    )
    assert row is not None
    return row


# Columns that may be patched and whether changing them bumps profile_updated_at.
async def update_persona(persona_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    """Build a dynamic SET clause from the provided fields only.

    `patch` uses the presence of a key (even with value None) to mean "set this".
    """
    fields: list[str] = []
    values: list[Any] = []

    def setcol(col: str, val: Any) -> None:
        values.append(val)
        fields.append(f"{col} = ${len(values)}")

    for col in (
        "name", "title", "description", "avatar_url",
        "system_prompt", "analysis_prompt", "analysis_schema", "consent_ack",
    ):
        if col in patch:
            setcol(col, patch[col])

    # Profile fields are JSONB. Only a change to the APPROVED profile bumps
    # profile_updated_at (the optimistic-lock token); saving a draft does not.
    if "profile" in patch:
        setcol("profile", patch["profile"])
        fields.append("profile_updated_at = now()")
    if "profile_draft" in patch:
        setcol("profile_draft", patch["profile_draft"])
    if "profile_meta" in patch:
        setcol("profile_meta", patch["profile_meta"])

    if not fields:
        current = await get_persona(persona_id)
        if not current:
            raise ValueError("Persona não encontrada.")
        return current

    values.append(persona_id)
    row = await query_one(
        f"update personas set {', '.join(fields)} where id = ${len(values)}::uuid returning {COLS}",
        values,
    )
    if not row:
        raise ValueError("Persona não encontrada.")
    return row


async def delete_persona(persona_id: str) -> None:
    await query("delete from personas where id = $1::uuid", [persona_id])


async def count_documents(persona_id: str) -> int:
    row = await query_one(
        "select count(*)::int as count from documents where persona_id = $1::uuid",
        [persona_id],
    )
    return int(row["count"]) if row else 0
