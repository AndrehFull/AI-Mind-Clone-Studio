import { NextResponse } from 'next/server'
import { getPersona } from '@/lib/personas'
import { ingestText, extractText } from '@/lib/ingest'

export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: { id: string } }

/** POST /api/personas/:id/documents/upload — ingest an uploaded file (multipart). */
export async function POST(req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, file.name, file.type)
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do arquivo.' },
        { status: 422 }
      )
    }

    const result = await ingestText(params.id, text, file.name)
    return NextResponse.json({ result }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
