/**
 * Pure profile helpers used by the Profile UI. NO server imports, so this is
 * safe in 'use client' code.
 *
 * The backend (FastAPI) is the source of truth for validation, rendering and
 * distillation. The frontend only needs the field metadata, an empty template
 * and the diff used to review a pending draft.
 */
import type { Profile, ProfileMeta, ProfileDiff, ProfileField, EvidencedItem } from './types'

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
