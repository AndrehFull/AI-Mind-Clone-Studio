"""Identity profile: validation, render, diff, and grounded distillation.

Port of lib/profile-shared.ts (pure helpers) + lib/profile.ts (distillation).
Profiles are plain dicts to stay 1:1 with the DB JSONB and the frontend shapes.
"""
from __future__ import annotations

import json
from typing import Any

from ..llm import chat_json
from .rag import retrieve_chunks

FIELDS = ["bio", "voice", "limits", "beliefs", "catchphrases", "facts"]

FIELD_LABELS = {
    "bio": "Bio",
    "voice": "Voz e tom",
    "limits": "Limites",
    "beliefs": "Crenças",
    "catchphrases": "Bordões",
    "facts": "Fatos",
}


def empty_profile() -> dict[str, Any]:
    """An empty, well-formed profile."""
    return {
        "version": 1,
        "archetype": "pessoa",
        "language": "pt-BR",
        "bio": "",
        "voice": [],
        "limits": [],
        "beliefs": [],
        "catchphrases": [],
        "facts": {},
    }


# Example proposal shown to the model during distillation.
EXAMPLE = {
    "version": 1,
    "archetype": "pessoa",
    "language": "pt-BR",
    "bio": "Uma frase ou parágrafo curto sobre quem é a pessoa.",
    "voice": ["direto", "usa humor seco", "frases curtas"],
    "limits": ["não dá conselhos médicos"],
    "beliefs": [
        {"text": "Acredita que disciplina vence talento", "evidence": '"...disciplina come talento no café da manhã"'},
    ],
    "catchphrases": [{"text": "bora pra cima", "evidence": '"bora pra cima, sem choro"'}],
    "facts": {"cidade": "São Paulo", "profissao": "engenheiro"},
}

# --- validation / sanitisation ---------------------------------------------

CAPS = {"bio": 1500, "item": 200, "listLen": 15, "factKey": 80, "factVal": 300, "factCount": 20}


def _str(v: Any) -> str:
    return v.strip() if isinstance(v, str) else ""


def _str_list(v: Any) -> list[str]:
    if not isinstance(v, list):
        return []
    out = [_str(x)[: CAPS["item"]] for x in v]
    return [x for x in out if x][: CAPS["listLen"]]


def _evidenced_list(v: Any, require_evidence: bool) -> list[dict[str, str]]:
    if not isinstance(v, list):
        return []
    items = []
    for x in v:
        o = x if isinstance(x, dict) else {}
        item = {"text": _str(o.get("text"))[: CAPS["item"]], "evidence": _str(o.get("evidence"))[: CAPS["item"]]}
        if item["text"] and (not require_evidence or item["evidence"]):
            items.append(item)
    return items[: CAPS["listLen"]]


def _fact_map(v: Any) -> dict[str, str]:
    if not isinstance(v, dict):
        return {}
    out: dict[str, str] = {}
    for k, val in list(v.items())[: CAPS["factCount"]]:
        key = _str(k)[: CAPS["factKey"]]
        value = _str(val)[: CAPS["factVal"]]
        if key and value:
            out[key] = value
    return out


def validate_profile(
    raw: Any,
    require_evidence: bool = False,
    archetype: str | None = None,
    language: str | None = None,
) -> dict[str, Any]:
    """Coerce arbitrary input (LLM output or edited form) into a well-formed profile."""
    o = raw if isinstance(raw, dict) else {}
    arch = "especialista" if o.get("archetype") == "especialista" or archetype == "especialista" else "pessoa"
    return {
        "version": 1,
        "archetype": arch,
        "language": _str(o.get("language")) or language or "pt-BR",
        "bio": _str(o.get("bio"))[: CAPS["bio"]],
        "voice": _str_list(o.get("voice")),
        "limits": _str_list(o.get("limits")),
        "beliefs": _evidenced_list(o.get("beliefs"), require_evidence),
        "catchphrases": _evidenced_list(o.get("catchphrases"), require_evidence),
        "facts": _fact_map(o.get("facts")),
    }


# --- rendering for the prompt ----------------------------------------------


def render_profile(profile: dict[str, Any] | None) -> str:
    """Render an approved profile into the identity block injected into the system
    prompt. Returns '' for a null profile so legacy personas are unaffected."""
    if not profile:
        return ""
    lines = ["### IDENTIDADE (quem você É — incorpore, NUNCA cite nem liste isto ao usuário)"]
    if _str(profile.get("bio")):
        lines.append(f"Bio: {profile['bio'].strip()}")
    if profile.get("voice"):
        lines.append(f"Voz e tom: {'; '.join(profile['voice'])}")
    if profile.get("beliefs"):
        lines.append("Crenças e posições:")
        for b in profile["beliefs"]:
            lines.append(f"- {b['text']}")
    if profile.get("catchphrases"):
        lines.append("Frases e bordões característicos:")
        for c in profile["catchphrases"]:
            lines.append(f"- \"{c['text']}\"")
    if profile.get("limits"):
        lines.append("Limites (o que você nunca faz/diz):")
        for limit in profile["limits"]:
            lines.append(f"- {limit}")
    facts = list((profile.get("facts") or {}).items())
    if facts:
        lines.append("Fatos estáveis:")
        for k, v in facts:
            lines.append(f"- {k}: {v}")
    if profile.get("language"):
        lines.append(f"Responda em {profile['language']}.")
    return "\n".join(lines)


# --- diff ------------------------------------------------------------------


def field_lines(p: dict[str, Any] | None, field: str) -> list[str]:
    """Human-readable lines for a single profile field (used in the diff UI)."""
    if not p:
        return []
    if field == "bio":
        return [p["bio"]] if p.get("bio") else []
    if field in ("voice", "limits"):
        return p.get(field, [])
    if field in ("beliefs", "catchphrases"):
        return [it["text"] for it in p.get(field, [])]
    if field == "facts":
        return [f"{k}: {v}" for k, v in (p.get("facts") or {}).items()]
    return []


def compute_diff(
    current: dict[str, Any] | None,
    proposed: dict[str, Any],
    meta: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Per-field diff between the current approved profile and a proposal."""
    diff = []
    for field in FIELDS:
        cur = field_lines(current, field)
        pro = field_lines(proposed, field)
        added = [x for x in pro if x not in cur]
        removed = [x for x in cur if x not in pro]
        diff.append(
            {
                "field": field,
                "changed": bool(added or removed),
                "protected": (meta or {}).get(field) == "human",
                "current": cur,
                "proposed": pro,
                "added": added,
                "removed": removed,
            }
        )
    return diff


# --- distillation ----------------------------------------------------------

DISTILL_SYSTEM = """Você destila a IDENTIDADE de uma pessoa a partir de evidências (trechos de material dela ou respostas de entrevista).

Regras ESTRITAS:
- Extraia SOMENTE o que está evidenciado no material. NÃO invente traços, crenças ou fatos.
- Para cada item de "beliefs" e "catchphrases", inclua em "evidence" uma citação curta do material que o sustenta. Sem evidência, não inclua o item.
- Se um campo não tiver suporte no material, deixe-o vazio ([] ou "").
- Seja conciso. Responda em JSON válido EXATAMENTE no formato do exemplo, sem texto fora do JSON."""

ANCHOR_QUERIES = [
    "como a pessoa fala, tom e estilo",
    "no que a pessoa acredita, opiniões e valores",
    "frases típicas e expressões que a pessoa repete",
    "o que a pessoa recusa, evita ou critica",
    "fatos sobre a vida, trabalho e história da pessoa",
]

SAMPLE_CHAR_BUDGET = 48000  # ~12k tokens


def _is_empty_profile(p: dict[str, Any]) -> bool:
    return (
        not p["bio"]
        and not p["voice"]
        and not p["limits"]
        and not p["beliefs"]
        and not p["catchphrases"]
        and not p["facts"]
    )


async def _sample_source_material(persona_id: str) -> str:
    """Sample the most identity-relevant chunks of a persona's knowledge base."""
    seen: set[int] = set()
    picked: list[str] = []
    chars = 0
    for q in ANCHOR_QUERIES:
        chunks = await retrieve_chunks(persona_id, q, 6)
        for c in chunks:
            if c["id"] in seen:
                continue
            if chars + len(c["content"]) > SAMPLE_CHAR_BUDGET:
                continue
            seen.add(c["id"])
            picked.append(c["content"])
            chars += len(c["content"])
    return "\n\n---\n\n".join(picked)


async def distill_profile(
    persona_id: str,
    source: str,
    answers: list[dict[str, str]] | None = None,
    archetype: str | None = None,
    language: str | None = None,
) -> dict[str, Any]:
    """Distil a profile proposal from a persona's sources or interview answers.

    Grounded (evidence-required for sources), temperature 0, validated, one retry.
    """
    from_interview = source == "interview"

    if from_interview:
        material = "\n\n".join(
            f"P: {a['question']}\nR: {a['answer'].strip()}"
            for a in (answers or [])
            if a.get("answer", "").strip()
        )
    else:
        material = await _sample_source_material(persona_id)

    if not material.strip():
        raise ValueError(
            "Sem respostas suficientes para destilar o perfil."
            if from_interview
            else "Esta persona ainda não tem material indexado para destilar. Use a entrevista ou adicione documentos."
        )

    user_content = (
        f"Formato esperado (exemplo):\n{json.dumps(EXAMPLE, ensure_ascii=False, indent=2)}\n\nMATERIAL:\n{material}"
    )
    messages = [
        {"role": "system", "content": DISTILL_SYSTEM},
        {"role": "user", "content": user_content},
    ]

    # Interview answers ARE the evidence, so do not require a separate quote there.
    require_evidence = not from_interview

    def _validate(raw: Any) -> dict[str, Any]:
        return validate_profile(raw, require_evidence=require_evidence, archetype=archetype, language=language)

    profile = _validate(await chat_json(messages, temperature=0))

    if _is_empty_profile(profile):
        retry = messages + [
            {
                "role": "user",
                "content": "Sua resposta veio vazia. Reextraia preenchendo bio, voice e ao menos uma belief com evidence, usando SOMENTE o material acima. Responda só com o JSON.",
            }
        ]
        profile = _validate(await chat_json(retry, temperature=0))

    return profile
