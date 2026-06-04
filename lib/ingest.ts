import { chunkText } from './chunk'
import { embedBatch } from './openai'
import { query, toVectorLiteral } from './db'

/** OpenAI's embeddings endpoint accepts a bounded batch size. */
const EMBED_BATCH = 96

export interface IngestResult {
  source: string
  chunks: number
}

/**
 * Chunk → embed → store a piece of text as knowledge for a persona.
 * `source` is recorded in each chunk's metadata for traceability.
 */
export async function ingestText(
  personaId: string,
  text: string,
  source: string,
  extraMetadata: Record<string, unknown> = {}
): Promise<IngestResult> {
  const chunks = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
  if (chunks.length === 0) return { source, chunks: 0 }

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH)
    const embeddings = await embedBatch(batch)

    const valuesSql: string[] = []
    const params: unknown[] = []
    batch.forEach((content, j) => {
      const base = params.length
      params.push(
        personaId,
        content,
        toVectorLiteral(embeddings[j]),
        JSON.stringify({ source, chunk_index: i + j, ...extraMetadata })
      )
      valuesSql.push(`($${base + 1}, $${base + 2}, $${base + 3}::vector, $${base + 4}::jsonb)`)
    })

    await query(
      `insert into documents (persona_id, content, embedding, metadata) values ${valuesSql.join(', ')}`,
      params
    )
  }

  return { source, chunks: chunks.length }
}

/** Extract plain text from an uploaded file buffer based on its type/name. */
export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const lower = fileName.toLowerCase()
  const isPdf = mimeType === 'application/pdf' || lower.endsWith('.pdf')

  if (isPdf) {
    // Lazy import keeps pdf-parse out of the edge/client bundle.
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  }

  // Treat everything else (.txt, .md, .csv, .json, ...) as UTF-8 text.
  return buffer.toString('utf-8')
}
