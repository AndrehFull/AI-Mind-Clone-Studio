import { notFound } from 'next/navigation'
import ParticleBackground from '@/components/ParticleBackground'
import PersonaWorkspace from '@/components/persona/PersonaWorkspace'
import { apiUrl } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function PersonaPage({ params }: { params: { id: string } }) {
  const res = await fetch(apiUrl(`/personas/${params.id}`), { cache: 'no-store' })
  if (!res.ok) notFound()
  const data = await res.json()
  if (!data.persona) notFound()

  return (
    <>
      <ParticleBackground />
      <main className="relative z-10 min-h-screen neural-network-bg">
        <PersonaWorkspace persona={data.persona} />
      </main>
    </>
  )
}
