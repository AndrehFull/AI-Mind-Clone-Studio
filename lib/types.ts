/** Shared domain types used across server and client. */

/** A digital clone of a person: their voice, knowledge and optional analysis mode. */
export interface Persona {
  id: string
  slug: string
  name: string
  /** Short role/tagline, e.g. "Lendário copywriter". */
  title: string | null
  /** Longer description shown on the persona card. */
  description: string | null
  avatar_url: string | null
  /** System prompt that defines how the clone thinks and speaks. */
  system_prompt: string
  /**
   * Optional. When present, the persona exposes a "structured analysis" mode:
   * the user submits a text and gets back JSON shaped like `analysis_schema`.
   */
  analysis_prompt: string | null
  /** Example JSON object describing the analysis output shape. */
  analysis_schema: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/** Payload accepted when creating/updating a persona. */
export interface PersonaInput {
  name: string
  title?: string | null
  description?: string | null
  avatar_url?: string | null
  system_prompt: string
  analysis_prompt?: string | null
  analysis_schema?: Record<string, unknown> | null
}

/** A chunk of knowledge attached to a persona (one row in `documents`). */
export interface KnowledgeDocument {
  id: number
  persona_id: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

/** A single message in a chat with a persona. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** A retrieved chunk used as RAG context. */
export interface RetrievedChunk {
  id: number
  content: string
  metadata: Record<string, unknown>
  similarity: number
}
