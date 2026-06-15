import type { ChatCompletionMessageParam } from 'openai/resources/index'
import type { Profile, Archetype } from './types'
import { chatJSON } from './openai'
import { retrieveChunks } from './rag'
import { EXAMPLE, validateProfile } from './profile-shared'

// Re-export pure helpers so server callers can import everything from '@/lib/profile'.
export { validateProfile, computeDiff, renderProfile, emptyProfile } from './profile-shared'

/** A profile is "empty" when distillation produced nothing usable (triggers a retry). */
function isEmptyProfile(p: Profile): boolean {
  return (
    !p.bio &&
    p.voice.length === 0 &&
    p.limits.length === 0 &&
    p.beliefs.length === 0 &&
    p.catchphrases.length === 0 &&
    Object.keys(p.facts).length === 0
  )
}

const DISTILL_SYSTEM = `Você destila a IDENTIDADE de uma pessoa a partir de evidências (trechos de material dela ou respostas de entrevista).

Regras ESTRITAS:
- Extraia SOMENTE o que está evidenciado no material. NÃO invente traços, crenças ou fatos.
- Para cada item de "beliefs" e "catchphrases", inclua em "evidence" uma citação curta do material que o sustenta. Sem evidência, não inclua o item.
- Se um campo não tiver suporte no material, deixe-o vazio ([] ou "").
- Seja conciso. Responda em JSON válido EXATAMENTE no formato do exemplo, sem texto fora do JSON.`

const ANCHOR_QUERIES = [
  'como a pessoa fala, tom e estilo',
  'no que a pessoa acredita, opiniões e valores',
  'frases típicas e expressões que a pessoa repete',
  'o que a pessoa recusa, evita ou critica',
  'fatos sobre a vida, trabalho e história da pessoa',
]

const SAMPLE_CHAR_BUDGET = 48000 // ~12k tokens

/** Sample the most identity-relevant chunks of a persona's knowledge base. */
async function sampleSourceMaterial(personaId: string): Promise<string> {
  const seen = new Set<number>()
  const picked: string[] = []
  let chars = 0

  for (const q of ANCHOR_QUERIES) {
    const chunks = await retrieveChunks(personaId, q, 6)
    for (const c of chunks) {
      if (seen.has(c.id)) continue
      if (chars + c.content.length > SAMPLE_CHAR_BUDGET) continue
      seen.add(c.id)
      picked.push(c.content)
      chars += c.content.length
    }
  }
  return picked.join('\n\n---\n\n')
}

export type DistillSource = 'sources' | 'interview'
export interface InterviewAnswer {
  question: string
  answer: string
}

/**
 * Distil a profile proposal from a persona's sources or from interview answers.
 * Grounded (evidence-required for sources), temperature 0, validated, one retry.
 */
export async function distillProfile(args: {
  personaId: string
  source: DistillSource
  answers?: InterviewAnswer[]
  archetype?: Archetype
  language?: string
}): Promise<Profile> {
  const fromInterview = args.source === 'interview'

  let material: string
  if (fromInterview) {
    material = (args.answers ?? [])
      .filter((a) => a.answer.trim())
      .map((a) => `P: ${a.question}\nR: ${a.answer.trim()}`)
      .join('\n\n')
  } else {
    material = await sampleSourceMaterial(args.personaId)
  }

  if (!material.trim()) {
    throw new Error(
      fromInterview
        ? 'Sem respostas suficientes para destilar o perfil.'
        : 'Esta persona ainda não tem material indexado para destilar. Use a entrevista ou adicione documentos.'
    )
  }

  const userContent = `Formato esperado (exemplo):\n${JSON.stringify(EXAMPLE, null, 2)}\n\nMATERIAL:\n${material}`
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: DISTILL_SYSTEM },
    { role: 'user', content: userContent },
  ]

  const opts = {
    // Interview answers ARE the evidence, so do not require a separate quote there.
    requireEvidence: !fromInterview,
    archetype: args.archetype,
    language: args.language,
  }

  let profile = validateProfile(await chatJSON(messages, { temperature: 0 }), opts)

  if (isEmptyProfile(profile)) {
    const retry: ChatCompletionMessageParam[] = [
      ...messages,
      {
        role: 'user',
        content:
          'Sua resposta veio vazia. Reextraia preenchendo bio, voice e ao menos uma belief com evidence, usando SOMENTE o material acima. Responda só com o JSON.',
      },
    ]
    profile = validateProfile(await chatJSON(retry, { temperature: 0 }), opts)
  }

  return profile
}
