/**
 * Centralised, validated access to server-side environment variables.
 *
 * Importing `env` from a server context (API routes, lib server helpers,
 * scripts) guarantees the required variables are present and gives a single
 * place to tweak defaults. Never import this from a `'use client'` module.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env.local and fill it in.`
    )
  }
  return value
}

export const env = {
  openaiApiKey: () => required('OPENAI_API_KEY'),
  embedModel: () => process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-large',
  chatModel: () => process.env.OPENAI_CHAT_MODEL || 'gpt-4o',

  /**
   * Postgres connection string (with pgvector). Works with a local Docker
   * Postgres OR a Supabase "direct connection" string.
   */
  databaseUrl: () => required('DATABASE_URL'),
}

/** Embedding dimensions — fixed by text-embedding-3-large and the DB schema. */
export const EMBEDDING_DIMENSIONS = 3072
