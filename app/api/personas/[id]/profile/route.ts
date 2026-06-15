import { NextResponse } from 'next/server'
import { getPersona, updatePersona } from '@/lib/personas'
import { validateProfile } from '@/lib/profile'
import type { ProfileMeta } from '@/lib/types'

export const runtime = 'nodejs'

type Params = { params: { id: string } }

/**
 * PATCH /api/personas/:id/profile
 * Body: { profile, profile_meta?, profile_updated_at? }
 * Approves a profile: saves it, records provenance, clears the draft.
 * This is the ONLY writer of the approved profile. Uses optimistic locking via
 * profile_updated_at (409 if the profile changed since the client loaded it).
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })

    const body = (await req.json()) as {
      profile?: unknown
      profile_meta?: ProfileMeta
      profile_updated_at?: string | null
    }
    if (!body.profile) {
      return NextResponse.json({ error: 'profile é obrigatório.' }, { status: 400 })
    }

    // Optimistic lock: reject if someone else approved a profile meanwhile.
    if (
      body.profile_updated_at !== undefined &&
      (persona.profile_updated_at ?? null) !== (body.profile_updated_at ?? null)
    ) {
      return NextResponse.json(
        { error: 'O perfil mudou desde que você abriu. Recarregue e revise novamente.' },
        { status: 409 }
      )
    }

    // Human-approved edits do not need a separate evidence quote.
    const profile = validateProfile(body.profile, {
      requireEvidence: false,
      archetype: persona.profile?.archetype,
    })

    const updated = await updatePersona(params.id, {
      profile,
      profile_meta: body.profile_meta ?? null,
      profile_draft: null,
    })
    return NextResponse.json({ persona: updated })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** DELETE /api/personas/:id/profile — discard the pending draft proposal. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const updated = await updatePersona(params.id, { profile_draft: null })
    return NextResponse.json({ persona: updated })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
