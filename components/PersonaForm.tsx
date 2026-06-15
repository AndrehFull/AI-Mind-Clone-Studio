'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessagesSquare, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import InterviewWizard from '@/components/persona/InterviewWizard'
import type { Archetype } from '@/lib/types'

type Mode = 'manual' | 'interview'

export default function PersonaForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('manual')

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [archetype, setArchetype] = useState<Archetype>('pessoa')
  const [enableAnalysis, setEnableAnalysis] = useState(false)
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  const [analysisSchema, setAnalysisSchema] = useState('')
  const [consent, setConsent] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // When set, the persona was created and we hand off to the interview.
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null)

  if (created) {
    return (
      <div className="max-w-3xl mx-auto">
        <InterviewWizard
          personaId={created.id}
          personaName={created.name}
          archetype={archetype}
          onDone={() => router.push(`/personas/${created.id}`)}
        />
      </div>
    )
  }

  const createPersona = async () => {
    let parsedSchema: unknown = null
    if (mode === 'manual' && enableAnalysis && analysisSchema.trim()) {
      try {
        parsedSchema = JSON.parse(analysisSchema)
      } catch {
        throw new Error('O schema de análise precisa ser um JSON válido.')
      }
    }

    const system =
      mode === 'manual'
        ? systemPrompt
        : `Você é o clone digital de ${name}. Responda sempre na primeira pessoa, como ${name}, incorporando fielmente a identidade definida no perfil. Use o contexto fornecido como memória.`

    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        title: title || null,
        description: description || null,
        avatar_url: avatarUrl || null,
        system_prompt: system,
        analysis_prompt: mode === 'manual' && enableAnalysis ? analysisPrompt || null : null,
        analysis_schema: mode === 'manual' && enableAnalysis ? parsedSchema : null,
        consent_ack: consent,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao criar persona.')
    return data.persona as { id: string; name: string }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const persona = await createPersona()
      if (mode === 'interview') {
        setCreated({ id: persona.id, name: persona.name })
      } else {
        router.push(`/personas/${persona.id}`)
      }
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
      <p className="text-gray-400 mb-6">Defina a identidade e a voz da mente que você quer reproduzir.</p>

      {/* Mode picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <ModeCard
          active={mode === 'interview'}
          onClick={() => setMode('interview')}
          icon={MessagesSquare}
          title="Por entrevista"
          desc="Responda algumas perguntas e a IA monta o perfil. Ideal para clonar uma pessoa."
        />
        <ModeCard
          active={mode === 'manual'}
          onClick={() => setMode('manual')}
          icon={PenLine}
          title="Do zero"
          desc="Escreva o system prompt você mesmo. Ideal para um especialista/autor."
        />
      </div>

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

        {mode === 'interview' ? (
          <div>
            <label className={label}>Tipo de clone</label>
            <div className="flex gap-2">
              {(['pessoa', 'especialista'] as Archetype[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArchetype(a)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    archetype === a
                      ? 'border-neon-blue/60 text-neon-cyan bg-neon-blue/10'
                      : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {a === 'pessoa' ? 'Pessoa' : 'Especialista / autor'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className={label}>System prompt * (como a mente pensa e fala)</label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Você é o clone digital de... Pense e fale como... Use o CONTEXTO fornecido como sua memória."
                className="min-h-[160px]"
                required={mode === 'manual'}
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
                      placeholder={'{\n  "resumo": "string",\n  "pontos": ["string"]\n}'}
                      className="min-h-[120px] font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Consent */}
        <label className="flex items-start gap-3 cursor-pointer hud-border rounded-lg p-4 bg-black/20">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-neon-cyan"
          />
          <span className="text-sm text-gray-300">
            Confirmo que sou esta pessoa ou tenho o consentimento dela para criar este clone, e que não vou usá-lo
            para impersonação ou fraude (ver <span className="text-neon-cyan">ETHICS.md</span>).
          </span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" variant="neon" size="lg" disabled={saving || !consent || !name.trim()} className="w-full">
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Criando...
            </span>
          ) : mode === 'interview' ? (
            'Começar entrevista'
          ) : (
            'Criar clone'
          )}
        </Button>
      </form>
    </div>
  )
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: typeof PenLine
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left hud-border rounded-xl p-4 transition-all ${
        active ? 'border-neon-blue/60 bg-neon-blue/10' : 'border-gray-700 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${active ? 'text-neon-cyan' : 'text-gray-400'}`} />
        <span className={`font-orbitron ${active ? 'text-neon-cyan' : 'text-white'}`}>{title}</span>
      </div>
      <p className="text-xs text-gray-400">{desc}</p>
    </button>
  )
}
