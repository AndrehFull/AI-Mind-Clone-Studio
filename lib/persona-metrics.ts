/**
 * Derives the Connectome card/panel metrics from REAL persona data.
 * Pure + client-safe. No mock numbers: every value maps to the app's data.
 */
import type { Persona, Profile } from './types'
import { DTI, LAYER_LABELS, REGIONS, hash } from './connectome'

export interface MindLayer {
  label: string
  active: boolean
  color: string
}

export interface PersonaVM {
  id: string
  name: string
  initials: string
  rel: string
  desc: string
  /** indexed knowledge chunks */
  mem: number
  /** profile completeness, 0–100 */
  pct: number
  status: string
  statusColor: string
  region: number
  regionLabel: string
  last: string
  layers: MindLayer[]
}

/** The six profile fields, in the same order as LAYER_LABELS. */
export function profileFlags(profile: Profile | null | undefined): boolean[] {
  if (!profile) return [false, false, false, false, false, false]
  return [
    !!profile.bio?.trim(),
    profile.voice?.length > 0,
    profile.limits?.length > 0,
    profile.beliefs?.length > 0,
    profile.catchphrases?.length > 0,
    Object.keys(profile.facts ?? {}).length > 0,
  ]
}

export function completeness(profile: Profile | null | undefined): number {
  const flags = profileFlags(profile)
  return Math.round((flags.filter(Boolean).length / flags.length) * 100)
}

/** Status reflects the real reconstruction state of the clone. */
function statusFor(persona: Persona): { label: string; color: string } {
  if (persona.profile) return { label: 'Reconstruída', color: 'var(--c-good)' }
  if (persona.profile_draft) return { label: 'Em revisão', color: 'var(--c-accent)' }
  return { label: 'Rascunho', color: 'var(--c-ink-3)' }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '')
  return (first + second).toUpperCase()
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const s = Math.max(0, (Date.now() - then) / 1000)
  if (s < 60) return 'agora'
  const m = s / 60
  if (m < 60) return `há ${Math.floor(m)} min`
  const h = m / 60
  if (h < 24) return `há ${Math.floor(h)} h`
  const d = h / 24
  if (d < 30) return `há ${Math.floor(d)} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** Stable, deterministic region assignment from the name. */
export function regionFor(name: string): number {
  return hash(name) % REGIONS.length
}

export function buildPersonaVM(persona: Persona): PersonaVM {
  const flags = profileFlags(persona.profile)
  const pct = Math.round((flags.filter(Boolean).length / flags.length) * 100)
  const st = statusFor(persona)
  const region = regionFor(persona.name)
  return {
    id: persona.id,
    name: persona.name,
    initials: initials(persona.name),
    rel: persona.title || '—',
    desc: persona.description || 'Sem descrição ainda.',
    mem: (persona as Persona & { document_count?: number }).document_count ?? 0,
    pct,
    status: st.label,
    statusColor: st.color,
    region,
    regionLabel: REGIONS[region].label,
    last: relativeTime(persona.updated_at),
    layers: LAYER_LABELS.map((label, i) => ({
      label,
      active: flags[i],
      color: flags[i] ? DTI[i % DTI.length] : 'rgba(255,255,255,.12)',
    })),
  }
}
