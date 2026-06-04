import { NextResponse } from 'next/server'
import type { ChatCompletionMessageParam } from 'openai/resources/index'
import { getPersona } from '@/lib/personas'
import { buildContext } from '@/lib/rag'
import { chatStream } from '@/lib/openai'
import type { ChatMessage } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: { id: string } }

/**
 * POST /api/personas/:id/chat
 * Body: { messages: ChatMessage[] }
 * Streams the assistant reply as plain text (text/event-stream-free chunks).
 */
export async function POST(req: Request, { params }: Params) {
  const persona = await getPersona(params.id)
  if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })

  const { messages } = (await req.json()) as { messages: ChatMessage[] }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages é obrigatório.' }, { status: 400 })
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const context = await buildContext(persona.id, lastUser)

  const system = `${persona.system_prompt}

### CONTEXTO (memória da persona — trechos mais relevantes)
${context}

Use o contexto acima como sua base de conhecimento. Se a resposta não estiver no contexto, responda com seu raciocínio e sinalize quando for inferência sua.`

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of chatStream(chatMessages)) {
          controller.enqueue(encoder.encode(delta))
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[erro: ${(err as Error).message}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
