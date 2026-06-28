/**
 * Shared constants + deterministic RNG for the Connectome visuals.
 * Pure (no imports), safe on client and server. Ported from the Claude Design
 * prototype "Mindclone Home".
 */

export interface Region {
  id: number
  label: string
  /** Anchor in brain-space (x=front+ right, y=up+). */
  c: [number, number, number]
}

/** Lateral brain-space regions used to focus the dive. */
export const REGIONS: Region[] = [
  { id: 0, label: 'Córtex pré-frontal', c: [0.66, 0.3, 0] },
  { id: 1, label: 'Córtex motor', c: [0.28, 0.62, 0] },
  { id: 2, label: 'Lobo parietal', c: [-0.06, 0.64, 0] },
  { id: 3, label: 'Lobo temporal', c: [-0.16, -0.42, 0] },
  { id: 4, label: 'Lobo occipital', c: [-0.72, 0.14, 0] },
  { id: 5, label: 'Cerebelo', c: [-0.58, -0.46, 0] },
]

/** DTI tractography colours (one per mind layer / fibre family). */
export const DTI = ['#ff3b54', '#34e36b', '#3b8bff', '#22d6d6', '#ff5fc8', '#ffd23f']

/** The six "mind layers" — aligned 1:1 with the profile fields. */
export const LAYER_LABELS = ['Biografia', 'Voz e tom', 'Limites', 'Crenças', 'Bordões', 'Memória factual']

/** FNV-1a hash → uint32. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32-style seeded RNG factory. */
export function rng(seed: number): () => number {
  let a = seed || 1
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hexToRgb(h: string): [number, number, number] {
  h = h.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Soft tint for a region's neuron close-up. */
export function tintFor(region: number): [number, number, number] {
  const d = hexToRgb(DTI[region % DTI.length])
  return [
    Math.round(150 * 0.58 + d[0] * 0.42),
    Math.round(202 * 0.58 + d[1] * 0.42),
    Math.round(246 * 0.58 + d[2] * 0.42),
  ]
}
