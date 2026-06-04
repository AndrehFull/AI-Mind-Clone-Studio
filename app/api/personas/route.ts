import { NextResponse } from 'next/server'
import { createPersona, listPersonas, countDocuments } from '@/lib/personas'
import type { PersonaInput } from '@/lib/types'

export const runtime = 'nodejs'

/** GET /api/personas — list all personas with their knowledge chunk counts. */
export async function GET() {
  try {
    const personas = await listPersonas()
    const withCounts = await Promise.all(
      personas.map(async (p) => ({ ...p, document_count: await countDocuments(p.id) }))
    )
    return NextResponse.json({ personas: withCounts })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** POST /api/personas — create a persona. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PersonaInput
    if (!body?.name?.trim() || !body?.system_prompt?.trim()) {
      return NextResponse.json(
        { error: 'name e system_prompt são obrigatórios.' },
        { status: 400 }
      )
    }
    const persona = await createPersona(body)
    return NextResponse.json({ persona }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
