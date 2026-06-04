import { notFound } from 'next/navigation'
import ParticleBackground from '@/components/ParticleBackground'
import PersonaWorkspace from '@/components/persona/PersonaWorkspace'
import { getPersona } from '@/lib/personas'

export const dynamic = 'force-dynamic'

export default async function PersonaPage({ params }: { params: { id: string } }) {
  let persona
  try {
    persona = await getPersona(params.id)
  } catch {
    notFound()
  }
  if (!persona) notFound()

  return (
    <>
      <ParticleBackground />
      <main className="relative z-10 min-h-screen neural-network-bg">
        <PersonaWorkspace persona={persona} />
      </main>
    </>
  )
}
