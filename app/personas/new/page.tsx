import PersonaForm from '@/components/PersonaForm'

export const metadata = { title: 'Novo clone — Mind Clone Studio' }

export default function NewPersonaPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <PersonaForm />
    </main>
  )
}
