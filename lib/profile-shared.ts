/**
 * Pure profile helpers shared by server and client. NO server-only imports
 * (no openai, no db) so this module is safe to import from 'use client' code.
 */
import type {
  Profile,
  ProfileMeta,
  ProfileDiff,
  ProfileField,
  EvidencedItem,
  Archetype,
} from './types'

export const FIELDS: ProfileField[] = ['bio', 'voice', 'limits', 'beliefs', 'catchphrases', 'facts']

export const FIELD_LABELS: Record<ProfileField, string> = {
  bio: 'Bio',
  voice: 'Voz e tom',
  limits: 'Limites',
  beliefs: 'Crenças',
  catchphrases: 'Bordões',
  facts: 'Fatos',
}

/** An empty, well-formed profile (starting point in the editor). */
export function emptyProfile(): Profile {
  return {
    version: 1,
    archetype: 'pessoa',
    language: 'pt-BR',
    bio: '',
    voice: [],
    limits: [],
    beliefs: [],
    catchphrases: [],
    facts: {},
  }
}

/** Example proposal shown to the model during distillation. */
export const EXAMPLE: Profile = {
  version: 1,
  archetype: 'pessoa',
  language: 'pt-BR',
  bio: 'Uma frase ou parágrafo curto sobre quem é a pessoa.',
  voice: ['direto', 'usa humor seco', 'frases curtas'],
  limits: ['não dá conselhos médicos'],
  beliefs: [
    { text: 'Acredita que disciplina vence talento', evidence: '"...disciplina come talento no café da manhã"' },
  ],
  catchphrases: [{ text: 'bora pra cima', evidence: '"bora pra cima, sem choro"' }],
  facts: { cidade: 'São Paulo', profissao: 'engenheiro' },
}

// --- validation / sanitisation ---------------------------------------------

const CAPS = { bio: 1500, item: 200, listLen: 15, factKey: 80, factVal: 300, factCount: 20 }
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => str(x).slice(0, CAPS.item)).filter(Boolean).slice(0, CAPS.listLen)
}

function evidencedList(v: unknown, requireEvidence: boolean): EvidencedItem[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>
      return { text: str(o.text).slice(0, CAPS.item), evidence: str(o.evidence).slice(0, CAPS.item) }
    })
    .filter((it) => it.text && (!requireEvidence || it.evidence))
    .slice(0, CAPS.listLen)
}

function factMap(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, CAPS.factCount)) {
    const key = str(k).slice(0, CAPS.factKey)
    const value = str(val).slice(0, CAPS.factVal)
    if (key && value) out[key] = value
  }
  return out
}

/** Coerce arbitrary input (LLM output or edited form) into a well-formed Profile. */
export function validateProfile(
  raw: unknown,
  opts: { requireEvidence?: boolean; archetype?: Archetype; language?: string } = {}
): Profile {
  const o = (raw ?? {}) as Record<string, unknown>
  const archetype: Archetype =
    o.archetype === 'especialista' || opts.archetype === 'especialista' ? 'especialista' : 'pessoa'
  return {
    version: 1,
    archetype,
    language: str(o.language) || opts.language || 'pt-BR',
    bio: str(o.bio).slice(0, CAPS.bio),
    voice: strList(o.voice),
    limits: strList(o.limits),
    beliefs: evidencedList(o.beliefs, opts.requireEvidence ?? false),
    catchphrases: evidencedList(o.catchphrases, opts.requireEvidence ?? false),
    facts: factMap(o.facts),
  }
}

// --- rendering for the prompt -----------------------------------------------

/**
 * Render an approved profile into the identity block injected into the system
 * prompt. Returns '' for a null profile so legacy personas are unaffected.
 */
export function renderProfile(profile: Profile | null | undefined): string {
  if (!profile) return ''
  const lines: string[] = [
    '### IDENTIDADE (quem você É — incorpore, NUNCA cite nem liste isto ao usuário)',
  ]
  if (profile.bio?.trim()) lines.push(`Bio: ${profile.bio.trim()}`)
  if (profile.voice?.length) lines.push(`Voz e tom: ${profile.voice.join('; ')}`)
  if (profile.beliefs?.length) {
    lines.push('Crenças e posições:')
    for (const b of profile.beliefs) lines.push(`- ${b.text}`)
  }
  if (profile.catchphrases?.length) {
    lines.push('Frases e bordões característicos:')
    for (const c of profile.catchphrases) lines.push(`- "${c.text}"`)
  }
  if (profile.limits?.length) {
    lines.push('Limites (o que você nunca faz/diz):')
    for (const l of profile.limits) lines.push(`- ${l}`)
  }
  const facts = profile.facts ? Object.entries(profile.facts) : []
  if (facts.length) {
    lines.push('Fatos estáveis:')
    for (const [k, v] of facts) lines.push(`- ${k}: ${v}`)
  }
  if (profile.language) lines.push(`Responda em ${profile.language}.`)
  return lines.join('\n')
}

// --- diff -------------------------------------------------------------------

const itemText = (it: EvidencedItem) => it.text
const factLines = (f: Record<string, string>) => Object.entries(f).map(([k, v]) => `${k}: ${v}`)

/** Human-readable lines for a single profile field (used in the diff UI). */
export function fieldLines(p: Profile | null, field: ProfileField): string[] {
  if (!p) return []
  switch (field) {
    case 'bio':
      return p.bio ? [p.bio] : []
    case 'voice':
      return p.voice
    case 'limits':
      return p.limits
    case 'beliefs':
      return p.beliefs.map(itemText)
    case 'catchphrases':
      return p.catchphrases.map(itemText)
    case 'facts':
      return factLines(p.facts)
  }
}

/** Per-field diff between the current approved profile and a proposal. */
export function computeDiff(
  current: Profile | null,
  proposed: Profile,
  meta: ProfileMeta | null
): ProfileDiff {
  return FIELDS.map((field) => {
    const cur = fieldLines(current, field)
    const pro = fieldLines(proposed, field)
    const added = pro.filter((x) => !cur.includes(x))
    const removed = cur.filter((x) => !pro.includes(x))
    return {
      field,
      changed: added.length > 0 || removed.length > 0,
      protected: meta?.[field] === 'human',
      current: cur,
      proposed: pro,
      added,
      removed,
    }
  })
}
