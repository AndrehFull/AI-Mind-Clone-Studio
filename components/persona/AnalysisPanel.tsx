'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Code, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Persona } from '@/lib/types'

/** Turn snake_case / camelCase keys into a readable label. */
function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase())
}

function Value({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-gray-500">—</span>

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-gray-200">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null)
    if (allPrimitive) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((v, i) => (
            <li key={i} className="text-gray-300 text-sm">
              {String(v)}
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="space-y-3">
        {value.map((v, i) => (
          <div key={i} className="p-3 rounded-lg bg-black/30 border border-gray-700">
            <ObjectView obj={v as Record<string, unknown>} />
          </div>
        ))}
      </div>
    )
  }

  return <ObjectView obj={value as Record<string, unknown>} />
}

function ObjectView({ obj }: { obj: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="text-sm">
          <span className="text-neon-cyan font-medium">{humanize(k)}: </span>
          <Value value={v} />
        </div>
      ))}
    </div>
  )
}

export default function AnalysisPanel({
  persona,
  onProcessing,
}: {
  persona: Persona
  onProcessing: (v: boolean) => void
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    onProcessing(true)
    try {
      const res = await fetch(`/api/personas/${persona.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      setResult(data.analysis)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      onProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="hud-border rounded-2xl bg-black/30 p-5 space-y-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cole o texto para análise estruturada..."
          className="min-h-[160px]"
        />
        <Button onClick={analyze} variant="neon" size="lg" disabled={loading || !input.trim()} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Analisando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Analisar
            </span>
          )}
        </Button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowJson((v) => !v)}
              className="flex items-center gap-2 text-sm text-neon-blue hover:text-neon-cyan"
            >
              {showJson ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
              {showJson ? 'Ver visual' : 'Ver JSON'}
            </button>
          </div>

          {showJson ? (
            <pre className="hud-border rounded-2xl bg-black/50 p-4 text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result).map(([key, value]) => (
                <div key={key} className="hud-border rounded-2xl bg-black/30 p-5">
                  <h3 className="font-orbitron text-neon-cyan mb-3">{humanize(key)}</h3>
                  <Value value={value} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
