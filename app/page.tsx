import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import ParticleBackground from '@/components/ParticleBackground'
import PersonaCard from '@/components/PersonaCard'
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

  return (
    <>
      <ParticleBackground />
      <main className="relative z-10 min-h-screen neural-network-bg px-6 py-16 max-w-7xl mx-auto">
        <header className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4">
            <span className="neon-text text-neon-blue">MIND</span>
            <span className="text-white mx-3">CLONE</span>
            <span className="neon-text text-neon-cyan">STUDIO</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            Crie o clone digital da mente de qualquer pessoa. Alimente com documentos, converse e analise.
          </p>
        </header>

        {!result.ok ? (
          <div className="max-w-2xl mx-auto hud-border rounded-2xl p-8 bg-black/40 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="font-orbitron text-xl text-white">Configuração necessária</h2>
            <p className="text-sm text-gray-300">
              Não foi possível falar com a API. Suba a stack com{' '}
              <code className="text-neon-cyan">docker compose up</code>, ou rode o backend
              (<code className="text-neon-cyan">uvicorn app.main:app</code>) e confira a
              variável <code className="text-neon-cyan">NEXT_PUBLIC_API_BASE_URL</code>.
            </p>
            <p className="text-xs text-gray-500 break-words">{result.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.personas.map((p) => (
              <PersonaCard key={p.id} persona={p} />
            ))}

            <Link href="/personas/new" className="group block">
              <div className="hud-border rounded-2xl p-6 h-full min-h-[180px] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:border-neon-cyan/60 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/40 mb-3">
                  <Plus className="w-7 h-7 text-neon-cyan" />
                </div>
                <span className="font-orbitron text-white group-hover:text-neon-cyan transition-colors">
                  Novo clone
                </span>
              </div>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
