import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/index'
import { env } from './env'

let openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: env.openaiApiKey() })
  }
  return openai
}

/** Max characters fed to the embedding model (guards the token limit). */
const MAX_EMBED_CHARS = 7500

/** Embed a single piece of text. Returns a 3072-dim vector. */
export async function embed(text: string): Promise<number[]> {
  const input = text.slice(0, MAX_EMBED_CHARS)
  const res = await getOpenAI().embeddings.create({
    model: env.embedModel(),
    input,
  })
  return res.data[0].embedding
}

/** Embed many texts in one call (used by ingestion). Preserves order. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const res = await getOpenAI().embeddings.create({
    model: env.embedModel(),
    input: texts.map((t) => t.slice(0, MAX_EMBED_CHARS)),
  })
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}

/** Non-streaming chat completion. */
export async function chat(messages: ChatCompletionMessageParam[]): Promise<string> {
  const res = await getOpenAI().chat.completions.create({
    model: env.chatModel(),
    messages,
  })
  return res.choices[0]?.message?.content ?? ''
}

/** Chat completion forced to return a JSON object. Returns the parsed value. */
export async function chatJSON<T = unknown>(
  messages: ChatCompletionMessageParam[]
): Promise<T> {
  const res = await getOpenAI().chat.completions.create({
    model: env.chatModel(),
    messages,
    response_format: { type: 'json_object' },
  })
  const content = res.choices[0]?.message?.content ?? '{}'
  return JSON.parse(content) as T
}

/** Streaming chat completion. Yields text deltas as they arrive. */
export async function* chatStream(
  messages: ChatCompletionMessageParam[]
): AsyncGenerator<string> {
  const stream = await getOpenAI().chat.completions.create({
    model: env.chatModel(),
    messages,
    stream: true,
  })
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}
