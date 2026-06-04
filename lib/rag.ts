import { embed } from './openai'
import { query, toVectorLiteral } from './db'
import type { RetrievedChunk } from './types'

/** Extract http(s) URLs cited in a text (e.g. sources referenced in a lead). */
export function extractUrls(text: string): string[] {
  return Array.from(text.matchAll(/https?:\/\/[^\s)]+/g), (m) => m[0])
}

/**
 * Retrieve the most relevant knowledge chunks for `query` within a persona's
 * knowledge base, via the `match_documents` Postgres function.
 */
export async function retrieveChunks(
  personaId: string,
  text: string,
  matchCount = 8
): Promise<RetrievedChunk[]> {
  if (!text.trim()) return []
  const embedding = await embed(text)

  return query<RetrievedChunk>(
    `select id::int as id, content, metadata, similarity
       from match_documents($1::vector, $2, $3::uuid)`,
    [toVectorLiteral(embedding), matchCount, personaId]
  )
}

/** Format retrieved chunks into a context block for the model prompt. */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return '(Nenhum material de conhecimento encontrado para esta persona.)'
  }
  return chunks
    .map((c, i) => {
      const source = (c.metadata?.source as string) || `chunk ${c.id}`
      return `[Trecho ${i + 1} | fonte: ${source} | score: ${c.similarity.toFixed(3)}]\n${c.content}`
    })
    .join('\n\n')
}

/** Convenience: retrieve + format in one call. */
export async function buildContext(
  personaId: string,
  text: string,
  matchCount = 8
): Promise<string> {
  const chunks = await retrieveChunks(personaId, text, matchCount)
  return formatContext(chunks)
}
