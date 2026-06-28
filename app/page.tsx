import { AlertTriangle } from 'lucide-react'
import HomeScene from '@/components/home/HomeScene'
import { apiUrl } from '@/lib/api'
import type { Persona } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadPersonas(): Promise<
  { ok: true; personas: (Persona & { document_count: number })[] } | { ok: false; error: string }
> {
  try {
    const res = await fetch(apiUrl('/personas'), { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
    return { ok: true, personas: data.personas }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export default async function Home() {
  const result = await loadPersonas()

  if (!result.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 max-w-lg text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-semibold text-c-ink">Configuração necessária</h2>
          <p className="text-sm text-c-ink2">
            Não foi possível falar com a API. Suba a stack com{' '}
            <code className="text-c-accent">docker compose up</code>, ou rode o backend e confira a
            variável <code className="text-c-accent">NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
          <p className="text-xs text-c-ink3 break-words">{result.error}</p>
        </div>
      </main>
    )
  }

  return <HomeScene personas={result.personas} />
}
