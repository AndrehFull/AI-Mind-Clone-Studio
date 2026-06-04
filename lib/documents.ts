import { query } from './db'
import type { KnowledgeDocument } from './types'

/** List knowledge chunks for a persona. */
export async function listDocuments(
  personaId: string,
  limit = 200
): Promise<KnowledgeDocument[]> {
  return query<KnowledgeDocument>(
    `select id::int as id, persona_id, content, metadata, created_at
       from documents
      where persona_id = $1
      order by id asc
      limit $2`,
    [personaId, limit]
  )
}

/** Delete a single chunk (must belong to the persona). */
export async function deleteDocument(personaId: string, docId: number): Promise<void> {
  await query(`delete from documents where persona_id = $1 and id = $2`, [personaId, docId])
}

/** Delete every chunk for a given source (used to "remove a document"). */
export async function deleteBySource(personaId: string, source: string): Promise<void> {
  await query(`delete from documents where persona_id = $1 and metadata->>'source' = $2`, [
    personaId,
    source,
  ])
}

/** Group chunks by their `source` metadata for a document-level listing. */
export interface KnowledgeSource {
  source: string
  chunks: number
}

export async function listSources(personaId: string): Promise<KnowledgeSource[]> {
  const rows = await query<{ source: string; chunks: number }>(
    `select coalesce(metadata->>'source', 'desconhecido') as source,
            count(*)::int as chunks
       from documents
      where persona_id = $1
      group by 1
      order by 1`,
    [personaId]
  )
  return rows.map((r) => ({ source: r.source, chunks: Number(r.chunks) }))
}
