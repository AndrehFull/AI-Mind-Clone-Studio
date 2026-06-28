'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Loader2, Sparkles, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { computeDiff, emptyProfile, FIELDS, FIELD_LABELS } from '@/lib/profile-shared'
import { apiFetch } from '@/lib/api'
import type { Persona, Profile, ProfileField, ProfileMeta } from '@/lib/types'

type Choice = 'current' | 'proposed'

export default function ProfilePanel({
  persona,
  onProcessing,
}: {
  persona: Persona
  onProcessing: (v: boolean) => void
}) {
  if (persona.profile_draft) {
    return <DraftReview persona={persona} />
  }
  return <ProfileEditor persona={persona} onProcessing={onProcessing} />
}

/* -------------------------------------------------------------------------- */
/* Draft review (diff + per-field approve)                                    */
/* -------------------------------------------------------------------------- */

function DraftReview({ persona }: { persona: Persona }) {
  const router = useRouter()
  const proposed = persona.profile_draft as Profile
  const current = persona.profile
  const diff = computeDiff(current, proposed, persona.profile_meta)

  // Default to the proposal, except on fields the human previously edited.
  const [choices, setChoices] = useState<Record<ProfileField, Choice>>(() => {
    const init = {} as Record<ProfileField, Choice>
    for (const d of diff) init[d.field] = d.protected ? 'current' : 'proposed'
    return init
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changed = diff.filter((d) => d.changed)

  const approve = async () => {
    setBusy(true)
    setError(null)
    const base = current ?? emptyProfile()
    const out: Profile = { ...emptyProfile(), ...base, archetype: proposed.archetype, language: proposed.language }
    const meta: ProfileMeta = { ...(persona.profile_meta ?? {}) }
    for (const f of FIELDS) {
      const useProposed = (choices[f] ?? 'proposed') === 'proposed'
      ;(out as unknown as Record<string, unknown>)[f] = useProposed ? proposed[f] : base[f]
      if (useProposed) meta[f] = 'distilled'
    }
    try {
      const res = await apiFetch(`/personas/${persona.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: out, profile_meta: meta, profile_updated_at: persona.profile_updated_at }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const discard = async () => {
    if (!confirm('Descartar a proposta da IA?')) return
    setBusy(true)
    await apiFetch(`/personas/${persona.id}/profile`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="hud-border rounded-2xl bg-black/30 p-5 border-neon-purple/50">
        <h3 className="font-orbitron text-neon-purple flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Proposta de perfil pela IA
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Revise campo a campo. Escolha entre o que está hoje e o que a IA propôs, depois aprove.
        </p>
      </div>

      {changed.length === 0 && (
        <p className="text-sm text-gray-400">A proposta não traz mudanças em relação ao perfil atual.</p>
      )}

      {changed.map((d) => (
        <div key={d.field} className="hud-border rounded-2xl bg-black/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-orbitron text-neon-cyan">
              {FIELD_LABELS[d.field]}
              {d.protected && <span className="ml-2 text-xs text-amber-400">editado à mão</span>}
            </h4>
            <div className="flex gap-1 text-xs">
              {(['current', 'proposed'] as Choice[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChoices((prev) => ({ ...prev, [d.field]: c }))}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    (choices[d.field] ?? 'proposed') === c
                      ? 'border-neon-blue/60 text-neon-cyan bg-neon-blue/10'
                      : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {c === 'current' ? 'Manter atual' : 'Usar proposto'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Atual</p>
              <ul className="space-y-1">
                {d.current.length === 0 && <li className="text-gray-600">(vazio)</li>}
                {d.current.map((line, i) => (
                  <li key={i} className={d.removed.includes(line) ? 'text-red-400 line-through' : 'text-gray-300'}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Proposto</p>
              <ul className="space-y-1">
                {d.proposed.length === 0 && <li className="text-gray-600">(vazio)</li>}
                {d.proposed.map((line, i) => (
                  <li key={i} className={d.added.includes(line) ? 'text-green-400' : 'text-gray-300'}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={approve} variant="neon" disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprovar perfil'}
        </Button>
        <Button onClick={discard} variant="outline" disabled={busy} className="border-gray-700 text-gray-400">
          Descartar
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Editor (chip lists)                                                        */
/* -------------------------------------------------------------------------- */

function ProfileEditor({
  persona,
  onProcessing,
}: {
  persona: Persona
  onProcessing: (v: boolean) => void
}) {
  const router = useRouter()
  const [p, setP] = useState<Profile>(persona.profile ?? emptyProfile())
  const [saving, setSaving] = useState(false)
  const [distilling, setDistilling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const patch = (fields: Partial<Profile>) => setP((prev) => ({ ...prev, ...fields }))

  const save = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    // Everything in this editor is human-authored.
    const meta = Object.fromEntries(FIELDS.map((f) => [f, 'human'])) as Record<ProfileField, 'human'>
    try {
      const res = await apiFetch(`/personas/${persona.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: p, profile_meta: meta, profile_updated_at: persona.profile_updated_at }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      setNotice('Perfil salvo.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const distill = async () => {
    setDistilling(true)
    setError(null)
    setNotice(null)
    onProcessing(true)
    try {
      const res = await apiFetch(`/personas/${persona.id}/profile/distill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'sources', archetype: p.archetype, language: p.language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      router.refresh() // loads the draft → switches to review mode
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDistilling(false)
      onProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="hud-border rounded-2xl bg-black/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-neon-cyan">Identidade</h3>
          {persona.profile_updated_at && (
            <span className="text-xs text-gray-500">
              atualizado {new Date(persona.profile_updated_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-1.5">Bio</label>
          <Textarea
            value={p.bio}
            onChange={(e) => patch({ bio: e.target.value })}
            placeholder="Quem é a pessoa, em poucas linhas."
            className="min-h-[90px]"
          />
        </div>

        <StringList label="Voz e tom" items={p.voice} onChange={(voice) => patch({ voice })} placeholder="Ex.: direto" />
        <ItemList label="Crenças" items={p.beliefs.map((b) => b.text)} onChange={(texts) => patch({ beliefs: texts.map((text) => ({ text, evidence: '' })) })} placeholder="Uma posição/valor" />
        <ItemList label="Bordões" items={p.catchphrases.map((c) => c.text)} onChange={(texts) => patch({ catchphrases: texts.map((text) => ({ text, evidence: '' })) })} placeholder="Uma frase típica" />
        <StringList label="Limites" items={p.limits} onChange={(limits) => patch({ limits })} placeholder="O que nunca diz/faz" />
        <FactsEditor facts={p.facts} onChange={(facts) => patch({ facts })} />
      </div>

      {notice && <p className="text-sm text-green-400">{notice}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} variant="neon" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar perfil</>}
        </Button>
        <Button
          onClick={distill}
          variant="outline"
          disabled={distilling}
          className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
        >
          {distilling ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Destilando...</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Re-destilar a partir das fontes</span>
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        A destilação gera uma proposta para você revisar e aprovar. Não sobrescreve direto.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Small list editors                                                         */
/* -------------------------------------------------------------------------- */

function StringList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-sm text-gray-300 block mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-gray-500 hover:text-red-400 px-2"
              aria-label="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ''])}
          className="text-sm text-neon-cyan hover:text-white flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  )
}

// Beliefs/catchphrases edit only their text in this UI; evidence stays as-is.
const ItemList = StringList

function FactsEditor({
  facts,
  onChange,
}: {
  facts: Record<string, string>
  onChange: (v: Record<string, string>) => void
}) {
  const rows = Object.entries(facts)
  const setRow = (i: number, key: string, value: string) => {
    const next = rows.map((r, j) => (j === i ? [key, value] : r)) as [string, string][]
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())))
  }
  return (
    <div>
      <label className="text-sm text-gray-300 block mb-1.5">Fatos</label>
      <div className="space-y-2">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex gap-2">
            <Input value={k} onChange={(e) => setRow(i, e.target.value, v)} placeholder="chave" className="w-1/3" />
            <Input value={v} onChange={(e) => setRow(i, k, e.target.value)} placeholder="valor" />
            <button
              onClick={() => onChange(Object.fromEntries(rows.filter((_, j) => j !== i)))}
              className="text-gray-500 hover:text-red-400 px-2"
              aria-label="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...facts, '': '' })}
          className="text-sm text-neon-cyan hover:text-white flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  )
}
