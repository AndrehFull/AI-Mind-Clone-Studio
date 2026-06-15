/** Shared domain types used across server and client. */

/** Which kind of source material dominates this clone. */
export type Archetype = 'pessoa' | 'especialista'

/** A belief/catchphrase must carry the evidence that justified it (anti-hallucination). */
export interface EvidencedItem {
  /** The claim (belief) or the phrase (catchphrase). */
  text: string
  /** A short verbatim quote from the sources, or '' when from an interview answer. */
  evidence: string
}

/**
 * Structured identity of a clone. This is the "spine" injected into every prompt.
 * Distilled by the LLM from sources/interview, then reviewed and approved by a human.
 */
export interface Profile {
  version: 1
  archetype: Archetype
  language: string
  bio: string
  /** Voice/tone descriptors, e.g. "direto", "usa ironia". */
  voice: string[]
  /** Hard limits, e.g. "não opina sobre política". */
  limits: string[]
  beliefs: EvidencedItem[]
  catchphrases: EvidencedItem[]
  /** Stable personal facts. Most sensitive field (PII). */
  facts: Record<string, string>
}

/** Editable top-level fields of a Profile (used by the diff/merge UI). */
export type ProfileField = 'bio' | 'voice' | 'limits' | 'beliefs' | 'catchphrases' | 'facts'

/** Per-field provenance: was this field last set by a human edit or by distillation? */
export type ProfileMeta = Partial<Record<ProfileField, 'human' | 'distilled'>>

/** Diff of a single profile field between the current and a proposed profile. */
export interface FieldDiff {
  field: ProfileField
  changed: boolean
  /** Field was previously edited by a human, so a re-distill should not clobber it silently. */
  protected: boolean
  /** Human-readable lines for the "current" and "proposed" columns. */
  current: string[]
  proposed: string[]
  /** For list fields: items present only in proposed / only in current. */
  added: string[]
  removed: string[]
}

export type ProfileDiff = FieldDiff[]


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
  /** Approved identity. Injected into every prompt. Null = legacy (system_prompt only). */
  profile: Profile | null
  /** Pending AI proposal awaiting human approval. Null = nothing to review. */
  profile_draft: Profile | null
  /** Per-field provenance for the approved profile. */
  profile_meta: ProfileMeta | null
  profile_updated_at: string | null
  /** Operator confirmed they are the person or have consent. */
  consent_ack: boolean
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
  profile?: Profile | null
  profile_draft?: Profile | null
  profile_meta?: ProfileMeta | null
  consent_ack?: boolean
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
