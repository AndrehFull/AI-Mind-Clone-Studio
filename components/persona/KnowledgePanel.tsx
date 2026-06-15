'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Trash2, Loader2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Persona } from '@/lib/types'
import type { KnowledgeSource } from '@/lib/documents'

export default function KnowledgePanel({ persona }: { persona: Persona }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [text, setText] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [lastDeleted, setLastDeleted] = useState<string | null>(null)
  const [redistilling, setRedistilling] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const refresh = async () => {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/personas/${persona.id}/documents`)
      const data = await res.json()
      if (res.ok) setSources(data.sources)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addText = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/personas/${persona.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: sourceName || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      setNotice(`Adicionado: ${data.result.chunks} trechos.`)
      setText('')
      setSourceName('')
      refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const uploadFile = async (file: File) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/personas/${persona.id}/documents/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      setNotice(`"${file.name}": ${data.result.chunks} trechos indexados.`)
      refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeSource = async (source: string) => {
    if (!confirm(`Remover "${source}" da base de conhecimento?`)) return
    setBusy(true)
    try {
      const res = await fetch(
        `/api/personas/${persona.id}/documents?source=${encodeURIComponent(source)}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setLastDeleted(source)
        refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  // Profile is curated and does not "unlearn" when a source is deleted; offer it.
  const reDistill = async () => {
    setRedistilling(true)
    setError(null)
    try {
      const res = await fetch(`/api/personas/${persona.id}/profile/distill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'sources' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      setLastDeleted(null)
      setNotice('Perfil re-destilado. Revise a proposta na aba Perfil.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRedistilling(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Add knowledge */}
      <div className="hud-border rounded-2xl bg-black/30 p-5 space-y-4">
        <h3 className="font-orbitron text-neon-cyan flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar conhecimento
        </h3>

        <Input
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Nome da fonte (opcional). Ex.: Entrevista 2024"
        />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui textos, transcrições, anotações sobre a pessoa..."
          className="min-h-[120px]"
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={addText} variant="neon" disabled={busy || !text.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Indexar texto'}
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadFile(f)
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10"
          >
            <Upload className="w-4 h-4 mr-2" /> Subir arquivo (PDF/TXT/MD)
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Apenas o conteúdo de texto do arquivo é extraído e indexado. O arquivo em si não é
          armazenado e não ficará disponível para download depois.
        </p>

        {notice && <p className="text-sm text-green-400">{notice}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Offer to re-distill the profile after a source was removed */}
      {lastDeleted && (
        <div className="hud-border rounded-2xl bg-black/30 p-4 border-neon-purple/40 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-300">
            Fonte removida do RAG. O perfil não esquece sozinho o que aprendeu dela.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={reDistill}
              variant="outline"
              size="sm"
              disabled={redistilling}
              className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
            >
              {redistilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Re-destilar perfil
                </span>
              )}
            </Button>
            <button onClick={() => setLastDeleted(null)} className="text-gray-500 hover:text-white text-sm">
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* Existing sources */}
      <div className="hud-border rounded-2xl bg-black/30 p-5">
        <h3 className="font-orbitron text-neon-cyan mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Base de conhecimento
        </h3>

        {loadingList ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : sources.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum material ainda. Adicione textos ou arquivos acima.</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s) => (
              <li
                key={s.source}
                className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-gray-700"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate">{s.source}</p>
                  <p className="text-xs text-gray-500">{s.chunks} trechos</p>
                </div>
                <button
                  onClick={() => removeSource(s.source)}
                  disabled={busy}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  aria-label="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
