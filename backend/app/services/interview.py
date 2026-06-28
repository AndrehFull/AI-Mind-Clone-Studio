"""Guided onboarding questions. Port of lib/interview.ts."""
from __future__ import annotations

COMMON = [
    "Em poucas frases, quem é essa pessoa? (uma mini-bio)",
    "Como as pessoas descreveriam o jeito dela falar? (tom, ritmo, gírias)",
    "Quais opiniões ou valores ela defende com firmeza?",
    "Tem frases ou expressões que ela repete bastante? Quais?",
    "Tem assuntos que ela evita ou coisas que ela nunca diria?",
]

PESSOA = [
    "Como ela reage quando discorda de alguém?",
    "O que costuma irritá-la e o que costuma empolgá-la?",
    "Fatos estáveis sobre ela (cidade, profissão, família, hobbies)?",
]

ESPECIALISTA = [
    "Qual a área de expertise dela e a tese central que ela defende?",
    "Quais princípios ou frameworks ela sempre aplica?",
    "Que erros comuns ela costuma criticar na área dela?",
    "Termos técnicos ou jargões que ela usa com frequência?",
]


def get_interview_questions(archetype: str) -> list[str]:
    return COMMON + (ESPECIALISTA if archetype == "especialista" else PESSOA)
