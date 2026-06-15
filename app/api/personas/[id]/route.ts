import { NextResponse } from 'next/server'
import { getPersona, updatePersona, deletePersona, countDocuments } from '@/lib/personas'
import type { PersonaInput } from '@/lib/types'

export const runtime = 'nodejs'

type Params = { params: { id: string } }

/** GET /api/personas/:id */
export async function GET(_req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })
    const document_count = await countDocuments(persona.id)
    return NextResponse.json({ persona: { ...persona, document_count } })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** PATCH /api/personas/:id */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = (await req.json()) as Partial<PersonaInput>
    // Profile fields are written only through the dedicated /profile route
    // (which validates and enforces optimistic locking). Strip them here.
    const { profile, profile_draft, profile_meta, ...patch } = body
    void profile
    void profile_draft
    void profile_meta
    const persona = await updatePersona(params.id, patch)
    return NextResponse.json({ persona })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** DELETE /api/personas/:id — cascades to its documents. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await deletePersona(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
