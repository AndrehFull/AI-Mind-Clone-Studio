import { NextResponse } from 'next/server'
import { getPersona } from '@/lib/personas'
import { ingestText } from '@/lib/ingest'
import { listSources, deleteBySource } from '@/lib/documents'

export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: { id: string } }

/** GET /api/personas/:id/documents — knowledge sources with chunk counts. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const sources = await listSources(params.id)
    return NextResponse.json({ sources })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** POST /api/personas/:id/documents — add knowledge from pasted text. */
export async function POST(req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })

    const { text, source } = (await req.json()) as { text?: string; source?: string }
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text é obrigatório.' }, { status: 400 })
    }
    const result = await ingestText(params.id, text, source?.trim() || 'Texto colado')
    return NextResponse.json({ result }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** DELETE /api/personas/:id/documents?source=... — remove a whole source. */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const source = new URL(req.url).searchParams.get('source')
    if (!source) return NextResponse.json({ error: 'source é obrigatório.' }, { status: 400 })
    await deleteBySource(params.id, source)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
