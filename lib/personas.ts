import { query, queryOne } from './db'
import type { Persona, PersonaInput } from './types'

const COLS = `id, slug, name, title, description, avatar_url,
  system_prompt, analysis_prompt, analysis_schema, created_at, updated_at`

/** Build a url-friendly slug from a name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function listPersonas(): Promise<Persona[]> {
  return query<Persona>(`select ${COLS} from personas order by created_at asc`)
}

export async function getPersona(id: string): Promise<Persona | null> {
  return queryOne<Persona>(`select ${COLS} from personas where id = $1`, [id])
}

/** Ensure a slug is unique by appending -2, -3, ... when needed. */
async function uniqueSlug(base: string): Promise<string> {
  const root = base || 'persona'
  let slug = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await queryOne(`select 1 from personas where slug = $1`, [slug])
    if (!existing) return slug
    n += 1
    slug = `${root}-${n}`
  }
}

export async function createPersona(input: PersonaInput): Promise<Persona> {
  const slug = await uniqueSlug(slugify(input.name))
  const row = await queryOne<Persona>(
    `insert into personas
       (slug, name, title, description, avatar_url, system_prompt, analysis_prompt, analysis_schema)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning ${COLS}`,
    [
      slug,
      input.name,
      input.title ?? null,
      input.description ?? null,
      input.avatar_url ?? null,
      input.system_prompt,
      input.analysis_prompt ?? null,
      input.analysis_schema ? JSON.stringify(input.analysis_schema) : null,
    ]
  )
  return row as Persona
}

export async function updatePersona(
  id: string,
  patch: Partial<PersonaInput>
): Promise<Persona> {
  // Build a dynamic SET clause from the provided fields only.
  const fields: string[] = []
  const values: unknown[] = []
  const set = (col: string, val: unknown) => {
    values.push(val)
    fields.push(`${col} = $${values.length}`)
  }

  if (patch.name !== undefined) set('name', patch.name)
  if (patch.title !== undefined) set('title', patch.title)
  if (patch.description !== undefined) set('description', patch.description)
  if (patch.avatar_url !== undefined) set('avatar_url', patch.avatar_url)
  if (patch.system_prompt !== undefined) set('system_prompt', patch.system_prompt)
  if (patch.analysis_prompt !== undefined) set('analysis_prompt', patch.analysis_prompt)
  if (patch.analysis_schema !== undefined) {
    set('analysis_schema', patch.analysis_schema ? JSON.stringify(patch.analysis_schema) : null)
  }

  if (fields.length === 0) {
    const current = await getPersona(id)
    if (!current) throw new Error('Persona não encontrada.')
    return current
  }

  values.push(id)
  const row = await queryOne<Persona>(
    `update personas set ${fields.join(', ')} where id = $${values.length} returning ${COLS}`,
    values
  )
  if (!row) throw new Error('Persona não encontrada.')
  return row
}

export async function deletePersona(id: string): Promise<void> {
  await query(`delete from personas where id = $1`, [id])
}

/** Count knowledge chunks for a persona (shown in the UI). */
export async function countDocuments(personaId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `select count(*)::int as count from documents where persona_id = $1`,
    [personaId]
  )
  return Number(row?.count ?? 0)
}
