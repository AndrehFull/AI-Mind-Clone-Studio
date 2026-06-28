'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { REGIONS, tintFor } from '@/lib/connectome'

/** Mutable camera/scene state. GSAP tweens these fields directly. */
export interface ViewState {
  zoom: number
  dim: number
  focus: number
  intensity: number
  panX: number
  panY: number
  focusAmt: number
  neuron: number
}

export interface BrainHandle {
  view: ViewState
  regions: typeof REGIONS
  /** Focus a region and regenerate the neuron close-up with its tint. */
  setFocusRegion: (region: number) => void
  flashEl: HTMLDivElement | null
  vignetteEl: HTMLDivElement | null
}

type Motion = 'calm' | 'alive' | 'intense'

interface Node {
  p: number[]
  region: number
  col: number[]
  hub: boolean
}

const BRAIN_BALLS = [
  { x: 0.0, y: 0.18, ax: 0.64, ay: 0.44, w: 1.0 },
  { x: 0.62, y: 0.24, ax: 0.36, ay: 0.36, w: 0.9 },
  { x: 0.8, y: -0.04, ax: 0.24, ay: 0.28, w: 0.62 },
  { x: -0.62, y: 0.14, ax: 0.36, ay: 0.36, w: 0.88 },
  { x: 0.06, y: 0.62, ax: 0.52, ay: 0.28, w: 0.74 },
  { x: -0.2, y: -0.4, ax: 0.44, ay: 0.28, w: 0.72 },
  { x: -0.58, y: -0.44, ax: 0.28, ay: 0.22, w: 0.58 },
]

function brainField(x: number, y: number): number {
  let s = 0
  for (const b of BRAIN_BALLS) {
    const dx = (x - b.x) / b.ax
    const dy = (y - b.y) / b.ay
    s += b.w * Math.exp(-(dx * dx + dy * dy) * 0.9)
  }
  return s
}

function nearestRegion(p: number[]): number {
  let bi = 0
  let bd = 1e9
  for (const r of REGIONS) {
    const dx = p[0] - r.c[0]
    const dy = p[1] - r.c[1]
    const d = dx * dx + dy * dy
    if (d < bd) {
      bd = d
      bi = r.id
    }
  }
  return bi
}

function mkRng(seed: number) {
  let a = seed || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildMesh() {
  const rnd = mkRng(20260628)
  const T = 0.52
  const nodes: Node[] = []
  let tries = 0
  while (nodes.length < 196 && tries < 9000) {
    tries++
    const x = rnd() * 2.5 - 1.25
    const y = rnd() * 2.0 - 0.95
    const v = brainField(x, y)
    if (v < T) continue
    const edge = v < T + 0.3
    const cx = x
    const cy = y - 0.16
    const r2 = Math.min(1, (cx * cx) / 1.1 + (cy * cy) / 0.95)
    const zb = Math.sqrt(Math.max(0, 1 - r2))
    const side = rnd() < 0.5 ? 1 : -1
    const z = side * zb * 0.52 * (edge ? 1 : 0.35 + rnd() * 0.65)
    const ty = Math.max(0, Math.min(1, (0.62 - y) / 1.2))
    const col = [Math.round(70 + ty * 120), Math.round(135 - ty * 45), Math.round(235 - ty * 10)]
    nodes.push({ p: [x, y, z], region: nearestRegion([x, y]), col, hub: false })
  }
  const rnd2 = mkRng(7)
  for (let h = 0; h < 14; h++) nodes[(rnd2() * nodes.length) | 0].hub = true
  const edges: [number, number, number][] = []
  const seen = new Set<string>()
  const K = 4
  const maxL = 0.4
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i].p
    const ds: [number, number][] = []
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue
      const b = nodes[j].p
      const dx = a[0] - b[0]
      const dy = a[1] - b[1]
      const dz = a[2] - b[2]
      ds.push([dx * dx + dy * dy + dz * dz, j])
    }
    ds.sort((p, q) => p[0] - q[0])
    for (let k = 0; k < K && k < ds.length; k++) {
      const j = ds[k][1]
      if (ds[k][0] > maxL * maxL) break
      const key = i < j ? i + '_' + j : j + '_' + i
      if (seen.has(key)) continue
      seen.add(key)
      edges.push([i, j, rnd()])
    }
  }
  return { nodes, edges }
}

interface NeuronCell {
  x: number
  y: number
  z: number
  r: number
  strokes: { pts: number[][]; w: number }[]
  ft: number
  fsp: number
  fd: number
}

function genNeurons(seedNum: number): NeuronCell[] {
  const rnd = mkRng((seedNum * 2654435761) >>> 0 || 7)
  const cells: NeuronCell[] = []
  const N = 7
  const growDend = (
    out: { pts: number[][]; w: number }[],
    ox: number,
    oy: number,
    ang: number,
    len: number,
    wid: number,
    depth: number
  ) => {
    const steps = Math.max(7, (len * 55) | 0)
    const seg = len / steps
    const pts: number[][] = [[ox, oy]]
    let x = ox
    let y = oy
    let a = ang
    for (let s = 0; s < steps; s++) {
      a += (rnd() - 0.5) * 0.55
      x += Math.cos(a) * seg
      y += Math.sin(a) * seg
      pts.push([x, y])
      if (depth < 2 && s > 2 && rnd() < 0.085) {
        growDend(out, x, y, a + (rnd() - 0.5) * 1.5, len * (0.3 + rnd() * 0.34), wid * 0.55, depth + 1)
      }
    }
    out.push({ pts, w: wid })
  }
  for (let i = 0; i < N; i++) {
    const big = i < 2
    const z = big ? 0.82 + rnd() * 0.18 : rnd() * 0.66
    const x = 0.05 + rnd() * 0.56
    const y = 0.12 + rnd() * 0.74
    const r = big ? 0.02 + rnd() * 0.013 : 0.0055 + rnd() * 0.011
    const nd = big ? 8 + ((rnd() * 4) | 0) : 5 + ((rnd() * 4) | 0)
    const strokes: { pts: number[][]; w: number }[] = []
    for (let d = 0; d < nd; d++) {
      const baseAng = (d / nd) * Math.PI * 2 + (rnd() - 0.5) * 0.6
      growDend(strokes, 0, 0, baseAng, (big ? 0.18 : 0.1) + rnd() * 0.16, (big ? 1.4 : 0.8) + rnd() * 0.6, 0)
    }
    cells.push({ x, y, z, r, strokes, ft: rnd(), fsp: 0.004 + rnd() * 0.006, fd: 0 })
  }
  return cells
}

const MOTION_MAP: Record<Motion, number> = { calm: 0.12, alive: 0.26, intense: 0.5 }

const BrainScene = forwardRef<BrainHandle, { motion?: Motion; fixed?: boolean }>(function BrainScene(
  { motion = 'alive', fixed = true },
  ref
) {
  const brainRef = useRef<HTMLCanvasElement>(null)
  const neuronRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)

  const viewRef = useRef<ViewState>({
    zoom: 1, dim: 0, focus: -1, intensity: 0.62, panX: 0, panY: 0, focusAmt: 0, neuron: 0,
  })
  const neuronsRef = useRef<NeuronCell[]>(genNeurons(7))
  const tintRef = useRef<[number, number, number]>([150, 202, 246])
  const motionRef = useRef<Motion>(motion)
  motionRef.current = motion

  useImperativeHandle(ref, () => ({
    view: viewRef.current,
    regions: REGIONS,
    setFocusRegion: (region: number) => {
      viewRef.current.focus = region
      neuronsRef.current = genNeurons(region + 3)
      tintRef.current = tintFor(region)
    },
    flashEl: flashRef.current,
    vignetteEl: vignetteRef.current,
  }))

  // ---- brain mesh engine ----
  useEffect(() => {
    const canvas = brainRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const v = viewRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { nodes, edges } = buildMesh()
    const pulses = Array.from({ length: 14 }, () => ({
      e: (Math.random() * edges.length) | 0,
      t: Math.random(),
      sp: 0.006 + Math.random() * 0.008,
    }))
    let W = 0, H = 0, cx = 0, cy = 0, base = 200, focal = 600
    let t = 0
    let raf = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width || window.innerWidth
      H = r.height || window.innerHeight
      canvas.width = Math.max(1, W * dpr)
      canvas.height = Math.max(1, H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      base = Math.min(W, H) * 0.46
      cx = W * 0.6
      cy = H * 0.46
      focal = base * 3.6
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    requestAnimationFrame(resize)
    setTimeout(resize, 120)
    window.addEventListener('resize', resize)

    const tilt = 0.1
    const proj = (
      pt: number[], R: number, cosA: number, sinA: number, cosT: number, sinT: number, ox: number, oy: number
    ) => {
      const x = pt[0], y = pt[1], z = pt[2]
      const x1 = x * cosA + z * sinA, z1 = -x * sinA + z * cosA
      const y2 = y * cosT - z1 * sinT, z2 = y * sinT + z1 * cosT
      const s = focal / (focal + z2 * R)
      return [ox + x1 * R * s, oy - y2 * R * s, z2, s]
    }
    const frame = () => {
      raf = requestAnimationFrame(frame)
      t += 0.016
      const osc = MOTION_MAP[motionRef.current] || 0.26
      const angle = Math.sin(t * osc) * 0.3 * (1 - 0.7 * v.focusAmt) + 0.12
      const cosA = Math.cos(angle), sinA = Math.sin(angle), cosT = Math.cos(tilt), sinT = Math.sin(tilt)
      const R = base * v.zoom
      let ox = cx + v.panX, oy = cy + v.panY
      if (v.focusAmt > 0.001 && v.focus >= 0) {
        const pc = proj(REGIONS[v.focus].c, R, cosA, sinA, cosT, sinT, cx, cy)
        ox = cx + (W * 0.4 - pc[0]) * v.focusAmt
        oy = cy + (H * 0.5 - pc[1]) * v.focusAmt
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, W, H)
      const bvis = 1 - Math.min(1, v.neuron * 1.12)
      if (bvis <= 0.015) return
      const cc = proj([0, 0.05, 0], R, cosA, sinA, cosT, sinT, ox, oy)
      const bloom = ctx.createRadialGradient(cc[0], cc[1], 0, cc[0], cc[1], R * 1.15)
      bloom.addColorStop(0, 'rgba(70,140,235,' + ((0.16 + 0.12 * v.intensity) * bvis).toFixed(3) + ')')
      bloom.addColorStop(0.45, 'rgba(40,60,160,' + (0.06 * bvis).toFixed(3) + ')')
      bloom.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, W, H)
      const pr = nodes.map((n) => proj(n.p, R, cosA, sinA, cosT, sinT, ox, oy))
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (let k = 0; k < edges.length; k++) {
        const i = edges[k][0], j = edges[k][1]
        const ni = nodes[i], nj = nodes[j]
        let rf = 1
        if (v.focus >= 0) rf = ni.region === v.focus || nj.region === v.focus ? 1 : 1 - v.dim
        if (rf <= 0.03) continue
        const a = pr[i], b = pr[j]
        const depth = ((a[2] + b[2]) / 2 + 1) / 2
        const boost = v.focus >= 0 && (ni.region === v.focus || nj.region === v.focus) ? 1.5 : 1
        const cr = (ni.col[0] + nj.col[0]) >> 1, cg = (ni.col[1] + nj.col[1]) >> 1, cb = (ni.col[2] + nj.col[2]) >> 1
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.strokeStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')'
        ctx.globalAlpha = Math.min(1, (0.07 + depth * 0.3) * rf * v.intensity * 1.7 * boost) * bvis
        ctx.lineWidth = (0.4 + depth * 0.9) * a[3]
        ctx.stroke()
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        let rf = 1
        if (v.focus >= 0) rf = n.region === v.focus ? 1 : 1 - v.dim
        if (rf <= 0.03) continue
        const a = pr[i], depth = (a[2] + 1) / 2, c = n.col
        const boost = v.focus >= 0 && n.region === v.focus ? 1.6 : 1
        if (n.hub) {
          const tw = 0.7 + 0.3 * Math.sin(t * 2.4 + i)
          ctx.shadowColor = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'
          ctx.shadowBlur = (8 + depth * 10) * tw
          ctx.beginPath()
          ctx.arc(a[0], a[1], (1.6 + depth * 2.0) * a[3], 0, Math.PI * 2)
          ctx.fillStyle =
            'rgb(' + Math.min(255, c[0] + 60) + ',' + Math.min(255, c[1] + 60) + ',' + Math.min(255, c[2] + 20) + ')'
          ctx.globalAlpha = Math.min(1, (0.5 + depth * 0.5) * rf * tw * boost) * bvis
          ctx.fill()
          ctx.shadowBlur = 0
        } else {
          ctx.beginPath()
          ctx.arc(a[0], a[1], (0.7 + depth * 1.1) * a[3], 0, Math.PI * 2)
          ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'
          ctx.globalAlpha = Math.min(1, (0.32 + depth * 0.5) * rf * boost) * bvis
          ctx.fill()
        }
      }
      for (let i = 0; i < pulses.length; i++) {
        const pu = pulses[i], e = edges[pu.e]
        if (!e) {
          pu.e = (Math.random() * edges.length) | 0
          continue
        }
        pu.t += pu.sp
        if (pu.t >= 1) {
          pu.t = 0
          pu.e = (Math.random() * edges.length) | 0
          continue
        }
        const ni = nodes[e[0]], nj = nodes[e[1]]
        let rf = 1
        if (v.focus >= 0) rf = ni.region === v.focus || nj.region === v.focus ? 1 : 1 - v.dim
        if (rf < 0.1) continue
        const a = pr[e[0]], b = pr[e[1]]
        const x = a[0] + (b[0] - a[0]) * pu.t, y = a[1] + (b[1] - a[1]) * pu.t
        ctx.shadowColor = 'rgba(190,235,255,.9)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, 1.5 * a[3] + 0.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(225,245,255,.95)'
        ctx.globalAlpha = 0.9 * rf * bvis
        ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1
    }
    frame()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ---- neuron close-up ----
  useEffect(() => {
    const canvas = neuronRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const v = viewRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6)
    let W = 0, H = 0, t = 0, raf = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width || window.innerWidth
      H = r.height || window.innerHeight
      canvas.width = Math.max(1, W * dpr)
      canvas.height = Math.max(1, H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    requestAnimationFrame(resize)
    setTimeout(resize, 120)
    window.addEventListener('resize', resize)
    const frame = () => {
      raf = requestAnimationFrame(frame)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const op = v.neuron
      if (op <= 0.01) return
      t += 0.016
      const sc = 0.42 + op * 0.74 + Math.sin(t * 0.25) * 0.012
      const ax = W * 0.42, ay = H * 0.5
      ctx.translate(ax, ay)
      ctx.scale(sc, sc)
      ctx.translate(-ax, -ay)
      const S = Math.min(W, H)
      const tint = tintRef.current
      const dx = Math.sin(t * 0.24) * S * 0.012, dy = Math.cos(t * 0.19) * S * 0.012
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      const cells = neuronsRef.current
      const cr = Math.round(tint[0] * 0.4 + 255 * 0.6)
      const cg = Math.round(tint[1] * 0.45 + 255 * 0.55)
      const cb = Math.round(tint[2] * 0.5 + 255 * 0.5)
      const dend = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ','
      const core = 'rgba(' + cr + ',' + cg + ',' + cb + ','
      for (const n of cells) {
        const front = 0.3 + n.z * 0.7
        const sx = n.x * W + dx * (0.4 + n.z), sy = n.y * H + dy * (0.4 + n.z)
        for (const st of n.strokes) {
          const last = st.pts[st.pts.length - 1]
          const ex = sx + last[0] * S, ey = sy + last[1] * S
          const g = ctx.createLinearGradient(sx, sy, ex, ey)
          g.addColorStop(0, dend + (0.5 * front * op).toFixed(3) + ')')
          g.addColorStop(1, dend + '0)')
          ctx.strokeStyle = g
          ctx.lineWidth = st.w * (0.6 + front * 1.1)
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          for (let i = 1; i < st.pts.length; i++) ctx.lineTo(sx + st.pts[i][0] * S, sy + st.pts[i][1] * S)
          ctx.stroke()
        }
        const sr = n.r * S
        ctx.shadowColor = dend + (0.9 * op).toFixed(3) + ')'
        ctx.shadowBlur = sr * 2.4 * front
        const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.1)
        rg.addColorStop(0, core + (0.96 * op).toFixed(3) + ')')
        rg.addColorStop(0.5, core + (0.5 * op * front).toFixed(3) + ')')
        rg.addColorStop(1, dend + '0)')
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        n.ft += n.fsp
        if (n.ft >= 1) {
          n.ft = 0
          n.fd = (Math.random() * n.strokes.length) | 0
        }
        const fst = n.strokes[n.fd]
        if (fst) {
          const fp = n.ft * (fst.pts.length - 1)
          const idx = Math.floor(fp), fr = fp - idx
          const a = fst.pts[idx], b = fst.pts[Math.min(fst.pts.length - 1, idx + 1)]
          const fx = sx + (a[0] + (b[0] - a[0]) * fr) * S, fy = sy + (a[1] + (b[1] - a[1]) * fr) * S
          ctx.shadowColor = 'rgba(220,245,255,' + op.toFixed(3) + ')'
          ctx.shadowBlur = 9
          ctx.fillStyle = 'rgba(232,248,255,' + (0.9 * op * front).toFixed(3) + ')'
          ctx.beginPath()
          ctx.arc(fx, fy, 1.7 * front + 0.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
      ctx.globalAlpha = 1
    }
    frame()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  const pos = fixed ? 'fixed' : 'absolute'
  return (
    <>
      <canvas ref={brainRef} style={{ position: pos, inset: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }} />
      <canvas
        ref={neuronRef}
        style={{ position: pos, inset: 0, width: '100%', height: '100%', zIndex: 1, display: 'block', pointerEvents: 'none' }}
      />
      {fixed && (
        <>
          <div
            ref={flashRef}
            style={{
              position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0,
              background: 'radial-gradient(circle at 42% 50%, rgba(150,195,255,.6), rgba(90,140,255,.15) 38%, transparent 64%)',
            }}
          />
          <div
            ref={vignetteRef}
            style={{
              position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0,
              background: 'radial-gradient(circle at 42% 50%, transparent 18%, rgba(4,6,12,.55) 62%, rgba(3,4,9,.9) 100%)',
            }}
          />
        </>
      )}
    </>
  )
})

export default BrainScene
