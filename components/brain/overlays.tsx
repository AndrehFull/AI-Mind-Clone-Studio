'use client'

/**
 * Static ambient layers over the brain canvas: depth gradients, masked grid,
 * a scan line, and the HUD corner readouts. Pointer-events: none throughout.
 * Ported from the Claude Design prototype.
 */
export function SceneOverlays() {
  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(120% 90% at 70% 42%, transparent 30%, rgba(4,5,10,.55) 72%, rgba(4,5,10,.92) 100%)',
        }}
      />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(100deg, rgba(4,5,10,.94) 0%, rgba(4,5,10,.72) 34%, transparent 62%)',
        }}
      />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.5,
          backgroundImage:
            'linear-gradient(rgba(120,160,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,255,.05) 1px, transparent 1px)',
          backgroundSize: '62px 62px',
          maskImage: 'radial-gradient(120% 100% at 50% 30%, #000, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(120% 100% at 50% 30%, #000, transparent 85%)',
        }}
      />
      <div
        style={{
          position: 'fixed', left: 0, right: 0, height: 140, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, transparent, rgba(34,211,238,.06), transparent)',
          animation: 'scan 9s linear infinite',
        }}
      />
      <div
        className="font-geist-mono"
        style={{
          position: 'fixed', bottom: 16, left: 20, zIndex: 2, pointerEvents: 'none',
          fontSize: 10, letterSpacing: '.06em', color: 'var(--c-ink-3)', lineHeight: 1.7,
        }}
      >
        <div>CONNECTOME&nbsp;ENGINE&nbsp;·&nbsp;v3.2</div>
        <div style={{ color: 'var(--c-accent)', opacity: 0.8 }}>
          ▸&nbsp;dti.tractography&nbsp;:&nbsp;<span style={{ animation: 'flick 2.2s ease-in-out infinite' }}>live</span>
        </div>
      </div>
      <div
        className="font-geist-mono"
        style={{
          position: 'fixed', bottom: 16, right: 20, zIndex: 2, pointerEvents: 'none',
          fontSize: 10, letterSpacing: '.06em', color: 'var(--c-ink-3)', textAlign: 'right', lineHeight: 1.7,
        }}
      >
        <div>streamlines&nbsp;1.24M&nbsp;·&nbsp;FA&nbsp;0.81</div>
        <div style={{ opacity: 0.7 }}>
          render&nbsp;<span style={{ color: 'var(--c-good)' }}>GPU</span>&nbsp;·&nbsp;60fps
        </div>
      </div>
    </>
  )
}
