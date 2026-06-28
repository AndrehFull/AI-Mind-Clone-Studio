"""Build the identity 'spine' of the system prompt. Port of lib/prompt.ts."""
from __future__ import annotations

from typing import Any

from .profile import render_profile


def build_system_prompt(persona: dict[str, Any]) -> str:
    """persona.system_prompt + the approved structured profile (if any).

    ONLY identity. Each route appends its own layer afterwards (chat appends the
    RAG context; analyze appends the analysis instructions).

    Backward compatible: a persona with no approved profile yields exactly its
    system_prompt, so existing personas (e.g. Eugene) are unchanged.
    """
    identity = render_profile(persona.get("profile"))
    if not identity:
        return persona["system_prompt"]
    return f"{persona['system_prompt']}\n\n{identity}"
