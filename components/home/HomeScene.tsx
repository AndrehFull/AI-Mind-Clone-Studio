'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import BrainScene, { type BrainHandle } from '@/components/brain/BrainScene'
import { SceneOverlays } from '@/components/brain/overlays'
import PersonaViz from '@/components/home/PersonaViz'
import { buildPersonaVM, type PersonaVM } from '@/lib/persona-metrics'
import type { Persona } from '@/lib/types'

const I = (s: string) => s // marker for inline-style readability

export default function HomeScene({ personas }: { personas: (Persona & { document_count?: number })[] }) {
  const router = useRouter()
  const vms = useMemo(() => personas.map(buildPersonaVM), [personas])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<PersonaVM | null>(null)

  const brain = useRef<BrainHandle>(null)
  const content = useRef<HTMLDivElement>(null)
  const browse = useRef<HTMLDivElement>(null)
  const browseCard = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const panelCard = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const bt = useRef<gsap.core.Timeline | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return vms
    return vms.filter((p) => (p.name + ' ' + p.rel + ' ' + p.desc).toLowerCase().includes(q))
  }, [vms, query])

  // Initial hidden states for the overlays.
  useEffect(() => {
    if (panel.current) gsap.set(panel.current, { autoAlpha: 0, pointerEvents: 'none' })
    if (browse.current) gsap.set(browse.current, { autoAlpha: 0, pointerEvents: 'none' })
    if (browseCard.current) gsap.set(browseCard.current, { xPercent: 100 })
  }, [])

  const openBrowse = () => {
    if (!browse.current || !browseCard.current) return
    bt.current?.kill()
    gsap.set(browse.current, { pointerEvents: 'auto' })
    const t = gsap.timeline()
    bt.current = t
    t.to(browse.current, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0).fromTo(
      browseCard.current,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.55, ease: 'power3.out' },
      0
    )
  }
  const closeBrowse = () => {
    if (!browse.current || !browseCard.current) return
    bt.current?.kill()
    const t = gsap.timeline()
    bt.current = t
    t.to(browseCard.current, { xPercent: 100, duration: 0.45, ease: 'power3.in' }, 0).to(
      browse.current,
      { autoAlpha: 0, duration: 0.45, ease: 'power2.in', onComplete: () => { gsap.set(browse.current!, { pointerEvents: 'none' }) } },
      0
    )
  }
  const hideBrowseFast = () => {
    if (!browse.current || !browseCard.current) return
    bt.current?.kill()
    gsap.to(browseCard.current, { xPercent: 100, duration: 0.4, ease: 'power2.in' })
    gsap.to(browse.current, { autoAlpha: 0, duration: 0.4, ease: 'power2.in', onComplete: () => { gsap.set(browse.current!, { pointerEvents: 'none' }) } })
  }

  // The cinematic dive: camera pushes in, brain dissolves, neurons grow, panel slides in.
  const openMind = (vm: PersonaVM) => {
    const b = brain.current
    if (!b) return
    setActive(vm)
    b.setFocusRegion(vm.region)
    const v = b.view
    hideBrowseFast()
    if (!panel.current || !content.current || !panelCard.current) {
      v.zoom = 12; v.dim = 0.5; v.focusAmt = 1; v.neuron = 1
      gsap.set(panel.current, { autoAlpha: 1, pointerEvents: 'auto' })
      return
    }
    tl.current?.kill()
    gsap.set(panel.current, { pointerEvents: 'auto' })
    const t = gsap.timeline()
    tl.current = t
    t.to(content.current, { autoAlpha: 0, y: -30, duration: 0.45, ease: 'power2.in' }, 0)
      .to(v, { focusAmt: 1, dim: 0.5, intensity: 1.08, duration: 0.55, ease: 'power2.out' }, 0)
      .to(v, { zoom: 12, duration: 2.5, ease: 'power2.in' }, 0)
      .to(v, { neuron: 1, duration: 1.6, ease: 'power1.inOut' }, 0.7)
      .to(b.vignetteEl, { opacity: 1, duration: 1.1, ease: 'power2.in' }, 0.4)
      .to(b.flashEl, { opacity: 0.46, duration: 0.42, ease: 'power2.in' }, 0.95)
      .to(b.flashEl, { opacity: 0, duration: 0.85, ease: 'power2.out' }, 1.4)
      .fromTo(panel.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 1.7)
      .fromTo(panelCard.current, { x: 80 }, { x: 0, duration: 0.7, ease: 'power3.out' }, 1.62)
  }

  const closeMind = () => {
    const b = brain.current
    if (!b || !panel.current || !content.current || !panelCard.current) return
    const v = b.view
    tl.current?.kill()
    const t = gsap.timeline()
    tl.current = t
    t.to(panelCard.current, { x: 60, duration: 0.38, ease: 'power2.in' }, 0)
      .to(panel.current, { autoAlpha: 0, duration: 0.38, ease: 'power2.in' }, 0)
      .to(v, { neuron: 0, duration: 0.85, ease: 'power2.inOut' }, 0)
      .to(b.vignetteEl, { opacity: 0, duration: 1.0, ease: 'power2.out' }, 0.2)
      .to(v, { zoom: 1, dim: 0, intensity: 0.62, focusAmt: 0, panX: 0, panY: 0, duration: 1.25, ease: 'power3.inOut', onComplete: () => { v.focus = -1 } }, 0.15)
      .to(content.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.55)
      .add(() => { gsap.set(panel.current!, { pointerEvents: 'none' }); setActive(null) })
  }

  const enterMind = (vm: PersonaVM) => router.push(`/personas/${vm.id}`)
  const newClone = () => router.push('/personas/new')

  const ink = 'var(--c-ink)', ink2 = 'var(--c-ink-2)', ink3 = 'var(--c-ink-3)'
  const line = 'var(--c-line)', line2 = 'var(--c-line-2)'
  const surface = 'var(--c-surface)', accent = 'var(--c-accent)'

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <BrainScene ref={brain} motion="alive" fixed />
      <SceneOverlays />

      {/* content */}
      <div ref={content} style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 34px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 78 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(150deg,#3b7bff,#22d3ee 40%,#34e36b 70%,#ff5fa8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 1px ${line2}, 0 6px 18px -8px rgba(34,211,238,.7)` }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#04060d', letterSpacing: '-0.04em' }}>m</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>mindclone</div>
              <div className="font-geist-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: ink3, border: `1px solid ${line}`, borderRadius: 6, padding: '2px 6px', marginLeft: 2 }}>STUDIO</div>
            </div>
            <div className="font-geist-mono" style={{ fontSize: 11, letterSpacing: '.12em', color: ink3 }}>
              {String(vms.length).padStart(2, '0')} {vms.length === 1 ? 'MENTE' : 'MENTES'}
            </div>
          </header>

          {/* hero */}
          <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '20px 0 40px', maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30, width: 'fit-content' }}>
              <span style={{ width: 46, height: 1, background: ink3 }} />
              <span className="font-geist-mono" style={{ fontSize: 11, letterSpacing: '.22em', color: ink3 }}>CONECTOMA COGNITIVO</span>
            </div>
            <h1 style={{ fontSize: 60, lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 600, margin: '0 0 22px' }}>
              A mente de alguém,<br />
              <span style={{ color: ink3, fontWeight: 500 }}>mapeada e viva.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: ink2, maxWidth: 460, margin: '0 0 38px' }}>
              Cada memória, voz e crença vira uma fibra do conectoma. O Mind Clone Studio reconstrói a forma de pensar de uma pessoa — e você conversa com ela.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <button onClick={newClone} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: accent, color: 'var(--c-accent-ink)', border: 'none', borderRadius: 13, padding: '15px 24px', fontFamily: 'inherit', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 12px 34px -12px var(--c-accent)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Criar novo clone
              </button>
              <button onClick={openBrowse} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: surface, backdropFilter: 'blur(10px)', color: ink, border: `1px solid ${line2}`, borderRadius: 13, padding: '15px 22px', fontFamily: 'inherit', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
                Explorar mentes
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* browse drawer */}
      <div ref={browse} onClick={closeBrowse} style={{ position: 'fixed', inset: 0, zIndex: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <div ref={browseCard} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(420px,92vw)', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(10,13,22,.84), rgba(7,9,16,.92))', backdropFilter: 'blur(22px)', borderLeft: `1px solid ${line2}`, boxShadow: '-40px 0 100px -40px rgba(0,0,0,.9)' }}>
          <div style={{ padding: '26px 24px 18px', borderBottom: `1px solid ${line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="font-geist-mono" style={{ fontSize: 11, letterSpacing: '.18em', color: ink3 }}>ARQUIVO DE MENTES · {String(vms.length).padStart(2, '0')}</div>
              <button onClick={closeBrowse} style={{ width: 30, height: 30, borderRadius: 9, background: 'transparent', border: `1px solid ${line2}`, color: ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,.04)', border: `1px solid ${line}`, borderRadius: 11, padding: '10px 12px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={I('var(--c-ink-3)')} strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" strokeLinecap="round" /></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pessoa…" style={{ background: 'transparent', border: 'none', outline: 'none', color: ink, fontFamily: 'inherit', fontSize: 13.5, width: '100%' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filtered.map((p) => (
              <div key={p.id} onClick={() => openMind(p)} className="hover:bg-white/5" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 13px', borderRadius: 13, cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.04)', border: `1.5px solid ${p.statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: ink, flexShrink: 0 }}>{p.initials}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</span>
                    <span style={{ fontSize: 10.5, color: ink2, background: 'rgba(255,255,255,.05)', border: `1px solid ${line}`, borderRadius: 5, padding: '1px 6px', whiteSpace: 'nowrap' }}>{p.rel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${p.pct}%`, height: '100%', borderRadius: 999, background: p.statusColor, boxShadow: `0 0 12px ${p.statusColor}` }} />
                    </div>
                    <span className="font-geist-mono" style={{ fontSize: 10, color: ink3, whiteSpace: 'nowrap' }}>{p.pct}%</span>
                  </div>
                  <div className="font-geist-mono" style={{ fontSize: 9.5, letterSpacing: '.08em', color: ink3, marginTop: 5, textTransform: 'uppercase' }}>{p.regionLabel} · {p.mem} mem</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={I('var(--c-ink-3)')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
              </div>
            ))}
            <div onClick={newClone} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 13, margin: '6px 6px 12px', border: `1px dashed ${line2}`, borderRadius: 13, cursor: 'pointer', color: ink2 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.04)', border: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>Clonar nova mente</div>
                <div style={{ fontSize: 12, color: ink3, marginTop: 2 }}>Importar documentos e memórias</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* detail panel */}
      <div ref={panel} onClick={closeMind} style={{ position: 'fixed', inset: 0, zIndex: 4, display: 'flex', justifyContent: 'flex-end' }}>
        {active && (
          <div style={{ position: 'absolute', top: 28, left: 34, pointerEvents: 'none' }} className="font-geist-mono">
            <div style={{ fontSize: 11, letterSpacing: '.1em', color: ink3, opacity: 0.7 }}>REGIÃO ATIVADA</div>
            <div style={{ fontSize: 13, marginTop: 3, color: accent }}>{active.regionLabel}</div>
          </div>
        )}
        <div ref={panelCard} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(460px,92vw)', height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg, rgba(10,13,22,.86), rgba(7,9,16,.92))', backdropFilter: 'blur(22px)', borderLeft: `1px solid ${line2}`, boxShadow: '-40px 0 100px -40px rgba(0,0,0,.9)', padding: '30px 32px 40px' }}>
          {active && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <button onClick={closeMind} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px solid ${line2}`, borderRadius: 10, padding: '8px 13px', color: ink2, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                  Voltar ao conectoma
                </button>
                <span className="font-geist-mono" style={{ fontSize: 10.5, color: ink3 }}>{active.mem} mem</span>
              </div>

              {/* tractography banner */}
              <div style={{ position: 'relative', height: 96, borderRadius: 14, overflow: 'hidden', border: `1px solid ${line}`, marginBottom: 22, background: '#05060c' }}>
                <PersonaViz name={active.name} region={active.region} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 130% at 50% 120%, transparent 40%, rgba(5,6,12,.85))' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.04)', border: `2px solid ${active.statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 20, color: ink, flexShrink: 0, boxShadow: `0 0 30px -6px ${active.statusColor}` }}>{active.initials}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{active.name}</span>
                    <span style={{ fontSize: 11.5, color: ink2, background: 'rgba(255,255,255,.05)', border: `1px solid ${line}`, borderRadius: 6, padding: '2px 8px' }}>{active.rel}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 12.5, color: active.statusColor }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.statusColor }} />{active.status}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 14.5, lineHeight: 1.62, color: ink2, margin: '0 0 26px' }}>{active.desc}</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <span className="font-geist-mono" style={{ fontSize: 10.5, letterSpacing: '.08em', color: ink3 }}>RECONSTRUÇÃO DO CONECTOMA</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: active.statusColor }}>{active.pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 26 }}>
                <div style={{ width: `${active.pct}%`, height: '100%', borderRadius: 999, background: active.statusColor, boxShadow: `0 0 12px ${active.statusColor}`, transition: 'width .6s cubic-bezier(.2,.7,.2,1)' }} />
              </div>

              <div className="font-geist-mono" style={{ fontSize: 10.5, letterSpacing: '.08em', color: ink3, marginBottom: 12 }}>CAMADAS DA MENTE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 30 }}>
                {active.layers.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: 'rgba(255,255,255,.03)', border: `1px solid ${line}`, borderRadius: 11 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: s.color, boxShadow: s.active ? `0 0 8px ${s.color}` : 'none' }} />
                    <span style={{ fontSize: 13.5, color: ink, flex: 1 }}>{s.label}</span>
                    <span className="font-geist-mono" style={{ fontSize: 11, color: s.active ? 'var(--c-good)' : ink3 }}>{s.active ? 'ativo' : 'pendente'}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => enterMind(active)} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: accent, color: 'var(--c-accent-ink)', border: 'none', borderRadius: 13, padding: 15, fontFamily: 'inherit', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 14px 36px -14px var(--c-accent)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h8M12 8l4 4-4 4" /></svg>
                Entrar na mente de {active.name}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
