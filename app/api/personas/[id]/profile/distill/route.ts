import { NextResponse } from 'next/server'
import { getPersona, updatePersona } from '@/lib/personas'
import { distillProfile, computeDiff, type DistillSource, type InterviewAnswer } from '@/lib/profile'
import type { Archetype } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: { id: string } }

/**
 * POST /api/personas/:id/profile/distill
 * Body: { source: 'sources' | 'interview', answers?, archetype?, language? }
 * Distils a profile proposal, saves it as the draft, and returns it with a diff
 * against the current approved profile. Does NOT change the approved profile.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })

    const body = (await req.json()) as {
      source?: DistillSource
      answers?: InterviewAnswer[]
      archetype?: Archetype
      language?: string
    }
    const source: DistillSource = body.source === 'interview' ? 'interview' : 'sources'

    const proposed = await distillProfile({
      personaId: params.id,
      source,
      answers: body.answers,
      archetype: body.archetype,
      language: body.language,
    })

    const diff = computeDiff(persona.profile, proposed, persona.profile_meta)
    await updatePersona(params.id, { profile_draft: proposed })

    return NextResponse.json({ proposed, diff })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
