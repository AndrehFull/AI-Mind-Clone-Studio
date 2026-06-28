'use client'

import { useMemo } from 'react'
import { DTI, hash, rng } from '@/lib/connectome'

/**
 * Deterministic DTI-tractography thumbnail per persona (SVG of curved fibres
 * seeded by the name). Port of the prototype's makeViz.
 */
export default function PersonaViz({ name, region }: { name: string; region: number }) {
  const paths = useMemo(() => {
    const rnd = rng(hash(name))
    const ox = 160
    const oy = 150
    const M = 13
    const out: { d: string; stroke: string; w: number; o: number }[] = []
    for (let k = 0; k < M; k++) {
      const ang = -Math.PI * 0.5 + (k / (M - 1) - 0.5) * Math.PI * 1.02
      const len = 58 + rnd() * 58
      const ex = ox + Math.cos(ang) * len * 1.55
      const ey = oy + Math.sin(ang) * len * 1.18
      const c1x = ox + Math.cos(ang) * len * 0.45 + (rnd() - 0.5) * 46
      const c1y = oy + Math.sin(ang) * len * 0.55
      out.push({
        d: `M${ox} ${oy} Q ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        stroke: DTI[(k + region) % DTI.length],
        w: 1.1 + rnd() * 1.5,
        o: 0.45 + rnd() * 0.45,
      })
    }
    return out
  }, [name, region])

  return (
    <svg
      viewBox="0 0 320 138"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, filter: 'saturate(1.25) blur(.2px)' }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.w.toFixed(1)}
          fill="none"
          opacity={p.o.toFixed(2)}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
