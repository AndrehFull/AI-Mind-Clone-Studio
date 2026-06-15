import type { Persona } from './types'
import { renderProfile } from './profile-shared'

/**
 * Build the identity "spine" of the system prompt: the persona's base
 * `system_prompt` plus its approved structured profile (if any).
 *
 * This is ONLY the identity. Each route appends its own layer afterwards
 * (chat appends the RAG context; analyze appends the analysis instructions).
 *
 * Backward compatible: a persona with no approved profile yields exactly its
 * `system_prompt`, so existing personas (e.g. Eugene) are unchanged.
 */
export function buildSystemPrompt(persona: Persona): string {
  const identity = renderProfile(persona.profile)
  if (!identity) return persona.system_prompt
  return `${persona.system_prompt}\n\n${identity}`
}
