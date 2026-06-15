import type { Archetype } from './types'

/**
 * Guided onboarding questions. Pure data (no server imports) so it can be used
 * by the client wizard. The answers are distilled into the persona's profile.
 */

const COMMON: string[] = [
  'Em poucas frases, quem é essa pessoa? (uma mini-bio)',
  'Como as pessoas descreveriam o jeito dela falar? (tom, ritmo, gírias)',
  'Quais opiniões ou valores ela defende com firmeza?',
  'Tem frases ou expressões que ela repete bastante? Quais?',
  'Tem assuntos que ela evita ou coisas que ela nunca diria?',
]

const PESSOA: string[] = [
  'Como ela reage quando discorda de alguém?',
  'O que costuma irritá-la e o que costuma empolgá-la?',
  'Fatos estáveis sobre ela (cidade, profissão, família, hobbies)?',
]

const ESPECIALISTA: string[] = [
  'Qual a área de expertise dela e a tese central que ela defende?',
  'Quais princípios ou frameworks ela sempre aplica?',
  'Que erros comuns ela costuma criticar na área dela?',
  'Termos técnicos ou jargões que ela usa com frequência?',
]

export function getInterviewQuestions(archetype: Archetype): string[] {
  return [...COMMON, ...(archetype === 'especialista' ? ESPECIALISTA : PESSOA)]
}
