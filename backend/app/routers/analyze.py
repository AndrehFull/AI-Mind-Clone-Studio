"""Structured analysis endpoint. Port of app/api/personas/[id]/analyze/route.ts."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from ..llm import chat_json
from ..schemas import AnalyzeRequest
from ..services.personas import get_persona
from ..services.prompts import build_system_prompt
from ..services.rag import extract_urls, format_context, retrieve_chunks

router = APIRouter(prefix="/personas", tags=["analyze"])


@router.post("/{persona_id}/analyze")
async def analyze(persona_id: str, body: AnalyzeRequest):
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")
    if not persona.get("analysis_prompt"):
        raise HTTPException(400, "Esta persona não tem o modo de análise estruturada habilitado.")
    if not body.input.strip():
        raise HTTPException(400, "input é obrigatório.")

    chunks = await retrieve_chunks(persona["id"], body.input, 10)
    context = format_context(chunks)
    urls = extract_urls(body.input)

    schema_hint = (
        f"\n\n### SCHEMA ESPERADO (responda exatamente nesta forma)\n"
        f"{json.dumps(persona['analysis_schema'], ensure_ascii=False, indent=2)}"
        if persona.get("analysis_schema")
        else ""
    )

    system = (
        f"{build_system_prompt(persona)}\n\n{persona['analysis_prompt']}{schema_hint}\n\n"
        "Responda EXCLUSIVAMENTE com um objeto JSON válido."
    )

    user = (
        f"### TEXTO PARA ANÁLISE\n{body.input}\n\n"
        f"### FONTES CITADAS NO TEXTO\n{chr(10).join(urls) if urls else '(nenhuma)'}\n\n"
        f"### CONTEXTO (trechos mais relevantes da base da persona)\n{context}"
    )

    analysis = await chat_json(
        [{"role": "system", "content": system}, {"role": "user", "content": user}]
    )
    return {"analysis": analysis}
