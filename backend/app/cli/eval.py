"""A/B evaluation of the identity layer. Port of scripts/eval.ts.

  python -m app.cli.eval --persona <slug-or-id> [--n 6]

For each out-of-knowledge question, generates an answer WITH the approved profile
and WITHOUT it (system_prompt only), then asks an LLM judge which better matches
the persona's identity. Proves the profile keeps the clone "in character".
"""
from __future__ import annotations

import asyncio
import json

import typer

app = typer.Typer(add_completion=False)

# Generic, persona-agnostic prompts unlikely to hit any knowledge base.
QUESTIONS = [
    "Me dá um conselho rápido para começar bem a semana.",
    "O que você acha mais importante: talento ou disciplina? Por quê?",
    "Como você reage quando alguém discorda fortemente de você?",
    "Recomende um hábito simples que muda a vida de alguém.",
    "Qual a sua opinião sobre trabalhar nos fins de semana?",
    "Se tivesse que se descrever em uma frase, qual seria?",
]


async def _run(ref: str, n: int) -> None:
    from ..db import close_pool, query_one
    from ..llm import chat, chat_json
    from ..services.prompts import build_system_prompt

    persona = await query_one(
        "select * from personas where slug = $1 or id::text = $1 limit 1", [ref]
    )
    if not persona:
        typer.echo(f"Persona não encontrada: {ref}", err=True)
        raise typer.Exit(1)
    if not persona.get("profile"):
        typer.echo(f'A persona "{persona["name"]}" não tem perfil aprovado. Nada para comparar.', err=True)
        raise typer.Exit(1)

    with_profile_system = build_system_prompt(persona)
    without_profile_system = persona["system_prompt"]
    questions = QUESTIONS[:n]

    wins_with = wins_without = ties = 0
    typer.echo(f'Avaliando "{persona["name"]}" em {len(questions)} perguntas fora do RAG...\n')

    for q in questions:
        a, b = await asyncio.gather(
            chat([{"role": "system", "content": with_profile_system}, {"role": "user", "content": q}]),
            chat([{"role": "system", "content": without_profile_system}, {"role": "user", "content": q}]),
        )
        verdict = await chat_json(
            [
                {
                    "role": "system",
                    "content": 'Você é um juiz de fidelidade de persona. Dado o PERFIL de identidade e duas respostas (A e B) à mesma pergunta, decida qual reflete melhor a voz, as crenças e os limites do perfil. Responda JSON {"winner":"A"|"B"|"tie","reason":"..."}.',
                },
                {
                    "role": "user",
                    "content": f"PERFIL:\n{json.dumps(persona['profile'], ensure_ascii=False)}\n\nPERGUNTA: {q}\n\nRESPOSTA A:\n{a}\n\nRESPOSTA B:\n{b}",
                },
            ],
            temperature=0,
        )
        winner = verdict.get("winner")
        if winner == "A":
            wins_with += 1
        elif winner == "B":
            wins_without += 1
        else:
            ties += 1
        label = "COM perfil" if winner == "A" else "SEM perfil" if winner == "B" else "empate"
        typer.echo(f"• {q}\n  → {label} — {verdict.get('reason')}\n")

    typer.echo("================ Resultado ================")
    typer.echo(f"COM perfil:  {wins_with}")
    typer.echo(f"SEM perfil:  {wins_without}")
    typer.echo(f"Empates:     {ties}")
    typer.echo("==========================================")
    await close_pool()


@app.command()
def main(
    persona: str = typer.Option(..., "--persona", help="slug ou id da persona."),
    n: int = typer.Option(6, "--n", help="número de perguntas."),
) -> None:
    asyncio.run(_run(persona, n))


if __name__ == "__main__":
    app()
