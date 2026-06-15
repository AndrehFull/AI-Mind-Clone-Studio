/**
 * A/B evaluation of the identity layer.
 *
 *   npm run eval -- --persona <slug-or-id> [--n 6]
 *
 * For each out-of-knowledge question, generates an answer WITH the approved
 * profile and WITHOUT it (system_prompt only), then asks an LLM judge which one
 * better matches the persona's identity (voice + beliefs). Proves the profile
 * keeps the clone "in character" even when RAG has nothing to retrieve.
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Generic, persona-agnostic prompts unlikely to hit any knowledge base.
const QUESTIONS = [
  'Me dá um conselho rápido para começar bem a semana.',
  'O que você acha mais importante: talento ou disciplina? Por quê?',
  'Como você reage quando alguém discorda fortemente de você?',
  'Recomende um hábito simples que muda a vida de alguém.',
  'Qual a sua opinião sobre trabalhar nos fins de semana?',
  'Se tivesse que se descrever em uma frase, qual seria?',
]

async function main() {
  const { getPool, queryOne } = await import('../lib/db')
  const { buildSystemPrompt } = await import('../lib/prompt')
  const { chat, chatJSON } = await import('../lib/openai')
  type Persona = import('../lib/types').Persona

  const args = process.argv.slice(2)
  const ref = args[args.indexOf('--persona') + 1]
  const n = Number(args[args.indexOf('--n') + 1]) || 6
  if (!ref || ref.startsWith('--')) {
    console.error('Uso: npm run eval -- --persona <slug-ou-id> [--n 6]')
    process.exit(1)
  }

  const persona = await queryOne<Persona>(
    `select * from personas where slug = $1 or id::text = $1 limit 1`,
    [ref]
  )
  if (!persona) {
    console.error(`Persona não encontrada: ${ref}`)
    process.exit(1)
  }
  if (!persona.profile) {
    console.error(`A persona "${persona.name}" não tem perfil aprovado. Nada para comparar.`)
    process.exit(1)
  }

  const withProfileSystem = buildSystemPrompt(persona)
  const withoutProfileSystem = persona.system_prompt
  const questions = QUESTIONS.slice(0, n)

  let winsWith = 0
  let winsWithout = 0
  let ties = 0

  console.log(`Avaliando "${persona.name}" em ${questions.length} perguntas fora do RAG...\n`)

  for (const q of questions) {
    const [a, b] = await Promise.all([
      chat([{ role: 'system', content: withProfileSystem }, { role: 'user', content: q }]),
      chat([{ role: 'system', content: withoutProfileSystem }, { role: 'user', content: q }]),
    ])

    const verdict = await chatJSON<{ winner: 'A' | 'B' | 'tie'; reason: string }>(
      [
        {
          role: 'system',
          content:
            'Você é um juiz de fidelidade de persona. Dado o PERFIL de identidade e duas respostas (A e B) à mesma pergunta, decida qual reflete melhor a voz, as crenças e os limites do perfil. Responda JSON {"winner":"A"|"B"|"tie","reason":"..."}.',
        },
        {
          role: 'user',
          content: `PERFIL:\n${JSON.stringify(persona.profile)}\n\nPERGUNTA: ${q}\n\nRESPOSTA A:\n${a}\n\nRESPOSTA B:\n${b}`,
        },
      ],
      { temperature: 0 }
    )

    if (verdict.winner === 'A') winsWith++
    else if (verdict.winner === 'B') winsWithout++
    else ties++

    console.log(`• ${q}\n  → ${verdict.winner === 'A' ? 'COM perfil' : verdict.winner === 'B' ? 'SEM perfil' : 'empate'} — ${verdict.reason}\n`)
  }

  console.log('================ Resultado ================')
  console.log(`COM perfil:  ${winsWith}`)
  console.log(`SEM perfil:  ${winsWithout}`)
  console.log(`Empates:     ${ties}`)
  console.log('==========================================')

  await getPool().end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
