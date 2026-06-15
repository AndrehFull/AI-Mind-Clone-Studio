import { NextResponse } from 'next/server'
import type { ChatCompletionMessageParam } from 'openai/resources/index'
import { getPersona } from '@/lib/personas'
import { retrieveChunks, formatContext, extractUrls } from '@/lib/rag'
import { buildSystemPrompt } from '@/lib/prompt'
import { chatJSON } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: { id: string } }

/**
 * POST /api/personas/:id/analyze
 * Body: { input: string }
 * Returns the persona's structured analysis as JSON (shape = analysis_schema).
 * Only available for personas that define an analysis_prompt.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const persona = await getPersona(params.id)
    if (!persona) return NextResponse.json({ error: 'Persona não encontrada.' }, { status: 404 })
    if (!persona.analysis_prompt) {
      return NextResponse.json(
        { error: 'Esta persona não tem o modo de análise estruturada habilitado.' },
        { status: 400 }
      )
    }

    const { input } = (await req.json()) as { input?: string }
    if (!input?.trim()) {
      return NextResponse.json({ error: 'input é obrigatório.' }, { status: 400 })
    }

    const chunks = await retrieveChunks(persona.id, input, 10)
    const context = formatContext(chunks)
    const urls = extractUrls(input)

    const schemaHint = persona.analysis_schema
      ? `\n\n### SCHEMA ESPERADO (responda exatamente nesta forma)\n${JSON.stringify(
          persona.analysis_schema,
          null,
          2
        )}`
      : ''

    const system = `${buildSystemPrompt(persona)}\n\n${persona.analysis_prompt}${schemaHint}\n\nResponda EXCLUSIVAMENTE com um objeto JSON válido.`

    const user = `### TEXTO PARA ANÁLISE\n${input}\n\n### FONTES CITADAS NO TEXTO\n${
      urls.length ? urls.join('\n') : '(nenhuma)'
    }\n\n### CONTEXTO (trechos mais relevantes da base da persona)\n${context}`

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]

    const analysis = await chatJSON(messages)
    return NextResponse.json({ analysis })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
