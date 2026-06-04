import { Pool } from 'pg'
import { env } from './env'

/**
 * Single shared Postgres connection pool (pgvector-enabled).
 * Server-only — import from API routes, server helpers and scripts.
 *
 * Works with a local Docker Postgres or a Supabase direct-connection string.
 */
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl(),
      // Supabase requires SSL; local Docker does not. Enable SSL when the URL
      // isn't pointing at localhost.
      ssl: /localhost|127\.0\.0\.1|@db:/.test(env.databaseUrl())
        ? undefined
        : { rejectUnauthorized: false },
    })
  }
  return pool
}

/** Run a query and return typed rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query(text, params)
  return res.rows as T[]
}

/** Run a query expecting at most one row. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** Format a number[] embedding into the pgvector text literal `[a,b,c]`. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
