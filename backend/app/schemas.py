"""Request/response models for the API boundary.

Domain data (personas, profiles) flows as plain dicts to stay 1:1 with the DB
rows and the frontend JSON shapes. These models only validate incoming bodies.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

Archetype = Literal["pessoa", "especialista"]


class PersonaCreate(BaseModel):
    name: str
    title: str | None = None
    description: str | None = None
    avatar_url: str | None = None
    system_prompt: str
    analysis_prompt: str | None = None
    analysis_schema: dict[str, Any] | None = None
    profile: dict[str, Any] | None = None
    profile_meta: dict[str, Any] | None = None
    consent_ack: bool = False


class PersonaPatch(BaseModel):
    name: str | None = None
    title: str | None = None
    description: str | None = None
    avatar_url: str | None = None
    system_prompt: str | None = None
    analysis_prompt: str | None = None
    analysis_schema: dict[str, Any] | None = None
    # Profile fields are intentionally NOT here: they are written only through
    # the dedicated /profile route (validation + optimistic locking).


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class AnalyzeRequest(BaseModel):
    input: str


class AddTextRequest(BaseModel):
    text: str
    source: str | None = None


class InterviewAnswer(BaseModel):
    question: str
    answer: str


class DistillRequest(BaseModel):
    source: Literal["sources", "interview"] = "sources"
    answers: list[InterviewAnswer] | None = None
    archetype: Archetype | None = None
    language: str | None = None


class ProfilePatchRequest(BaseModel):
    profile: dict[str, Any] | None = None
    profile_meta: dict[str, Any] | None = None
    profile_updated_at: str | None = None
