'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function PersonaForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [enableAnalysis, setEnableAnalysis] = useState(false)
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  const [analysisSchema, setAnalysisSchema] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    let parsedSchema: unknown = null
    if (enableAnalysis && analysisSchema.trim()) {
      try {
        parsedSchema = JSON.parse(analysisSchema)
      } catch {
        setError('O schema de análise precisa ser um JSON válido.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title: title || null,
          description: description || null,
          avatar_url: avatarUrl || null,
          system_prompt: systemPrompt,
          analysis_prompt: enableAnalysis ? analysisPrompt || null : null,
          analysis_schema: enableAnalysis ? parsedSchema : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar persona.')
      router.push(`/personas/${data.persona.id}`)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  const label = 'block text-sm font-medium text-gray-300 mb-1.5'

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon-cyan mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-orbitron font-bold text-white mb-2">Novo clone</h1>
      <p className="text-gray-400 mb-8">Defina a identidade e a voz da mente que você quer reproduzir.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={label}>Nome *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Eugene Schwartz" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Título / papel</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Lendário copywriter" />
          </div>
          <div>
            <label className={label}>URL do avatar</label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className={label}>Descrição</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Uma breve descrição mostrada no card da persona."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label className={label}>System prompt * (como a mente pensa e fala)</label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Você é o clone digital de... Pense e fale como... Use o CONTEXTO fornecido como sua memória."
            className="min-h-[160px]"
            required
          />
        </div>

        <div className="hud-border rounded-lg p-4 bg-black/20 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAnalysis}
              onChange={(e) => setEnableAnalysis(e.target.checked)}
              className="w-4 h-4 accent-neon-cyan"
            />
            <span className="text-sm text-gray-200">
              Habilitar modo de <span className="text-neon-purple">análise estruturada</span> (saída em JSON)
            </span>
          </label>

          {enableAnalysis && (
            <div className="space-y-4 pt-2">
              <div>
                <label className={label}>Prompt de análise</label>
                <Textarea
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  placeholder="Analise o texto fornecido e produza... Responda exclusivamente em JSON."
                  className="min-h-[120px]"
                />
              </div>
              <div>
                <label className={label}>Schema de exemplo (JSON)</label>
                <Textarea
                  value={analysisSchema}
                  onChange={(e) => setAnalysisSchema(e.target.value)}
                  placeholder='{\n  "resumo": "string",\n  "pontos": ["string"]\n}'
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" variant="neon" size="lg" disabled={saving} className="w-full">
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Criando...
            </span>
          ) : (
            'Criar clone'
          )}
        </Button>
      </form>
    </div>
  )
}
