"""Streaming chat endpoint. Port of app/api/personas/[id]/chat/route.ts."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..llm import chat_stream
from ..schemas import ChatRequest
from ..services.personas import get_persona
from ..services.prompts import build_system_prompt
from ..services.rag import build_context

router = APIRouter(prefix="/personas", tags=["chat"])


@router.post("/{persona_id}/chat")
async def chat(persona_id: str, body: ChatRequest):
    """Streams the assistant reply as plain text."""
    persona = await get_persona(persona_id)
    if not persona:
        raise HTTPException(404, "Persona não encontrada.")

    messages = body.messages
    if not messages:
        raise HTTPException(400, "messages é obrigatório.")

    last_user = next((m.content for m in reversed(messages) if m.role == "user"), "")
    context = await build_context(persona["id"], last_user)

    system = f"""{build_system_prompt(persona)}

### CONTEXTO (memória da persona — trechos mais relevantes)
{context}

Use o contexto acima como memória factual. Se a resposta não estiver no contexto, responda com seu raciocínio mantendo sua identidade, e sinalize quando for inferência sua. Onde os fatos do contexto divergirem da sua identidade, o contexto prevalece."""

    chat_messages = [{"role": "system", "content": system}] + [
        {"role": m.role, "content": m.content} for m in messages
    ]

    async def generate():
        try:
            async for delta in chat_stream(chat_messages):
                yield delta
        except Exception as err:  # noqa: BLE001 — surface errors inside the stream
            yield f"\n\n[erro: {err}]"

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache, no-transform"},
    )
