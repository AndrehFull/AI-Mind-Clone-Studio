import ParticleBackground from '@/components/ParticleBackground'
import PersonaForm from '@/components/PersonaForm'

export const metadata = { title: 'Novo clone — Mind Clone Studio' }

export default function NewPersonaPage() {
  return (
    <>
      <ParticleBackground />
      <main className="relative z-10 min-h-screen neural-network-bg px-6 py-16">
        <PersonaForm />
      </main>
    </>
  )
}
