"""Bulk knowledge ingestion CLI. Port of scripts/ingest.ts.

  python -m app.cli.ingest --persona <slug-or-id> <file-or-dir> [more...]

Reads OPENAI_* and DATABASE_URL from the environment (or ../.env.local).
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import typer

app = typer.Typer(add_completion=False)


async def _run(persona_ref: str, paths: list[str]) -> None:
    from ..db import close_pool, query_one
    from ..services.ingest import extract_text, ingest_text

    persona = await query_one(
        "select id, name, slug from personas where slug = $1 or id::text = $1 limit 1",
        [persona_ref],
    )
    if not persona:
        typer.echo(f"Persona não encontrada: {persona_ref}", err=True)
        raise typer.Exit(1)
    typer.echo(f"→ Persona: {persona['name']} ({persona['slug']})")

    # Expand directories into their files.
    files: list[Path] = []
    for p in paths:
        path = Path(p)
        if path.is_dir():
            files.extend(sorted(path.iterdir()))
        else:
            files.append(path)

    for file in files:
        try:
            text = extract_text(file.read_bytes(), file.name)
            if not text.strip():
                typer.echo(f"  ⚠ {file.name}: sem texto extraível, pulado.")
                continue
            result = await ingest_text(str(persona["id"]), text, file.name)
            typer.echo(f"  ✓ {file.name}: {result['chunks']} trechos indexados.")
        except Exception as err:  # noqa: BLE001
            typer.echo(f"  ✗ {file.name}: {err}", err=True)

    typer.echo("Concluído.")
    await close_pool()


@app.command()
def main(
    paths: list[str] = typer.Argument(..., help="Arquivos ou pastas para indexar."),
    persona: str = typer.Option(..., "--persona", help="slug ou id da persona."),
) -> None:
    asyncio.run(_run(persona, paths))


if __name__ == "__main__":
    app()
