'use client'

import { useMemo, useState } from 'react'
import { Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getInterviewQuestions } from '@/lib/interview'
import type { Archetype } from '@/lib/types'

/**
 * Stepped onboarding interview. Asks one question at a time, then makes a single
 * distillation call that turns the answers into a profile draft for review.
 */
export default function InterviewWizard({
  personaId,
  personaName,
  archetype,
  language = 'pt-BR',
  onDone,
}: {
  personaId: string
  personaName: string
  archetype: Archetype
  language?: string
  onDone: () => void
}) {
  const questions = useMemo(() => getInterviewQuestions(archetype), [archetype])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLast = step === questions.length - 1
  const progress = Math.round(((step + 1) / questions.length) * 100)

  const finish = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = questions
        .map((question, i) => ({ question, answer: answers[i] }))
        .filter((a) => a.answer.trim())
      if (payload.length === 0) throw new Error('Responda ao menos uma pergunta.')

      const res = await fetch(`/api/personas/${personaId}/profile/distill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'interview', answers: payload, archetype, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      onDone()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span className="font-orbitron text-neon-cyan">Entrevista de {personaName}</span>
          <span>
            {step + 1} de {questions.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div className="h-full bg-neon-cyan transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="hud-border rounded-2xl bg-black/30 p-6 space-y-4">
        <div className="bg-black/40 border border-gray-700 rounded-2xl px-4 py-3 text-gray-200">
          {questions[step]}
        </div>
        <Textarea
          value={answers[step]}
          onChange={(e) => setAnswers((prev) => prev.map((a, i) => (i === step ? e.target.value : a)))}
          placeholder="Responda com naturalidade. Pode pular se não souber."
          className="min-h-[140px]"
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

      <div className="flex justify-between mt-5">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
          className="border-gray-700 text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>

        {isLast ? (
          <Button onClick={finish} variant="neon" disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando perfil...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Gerar perfil
              </span>
            )}
          </Button>
        ) : (
          <Button variant="neon" onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))} disabled={busy}>
            Próxima <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
