"""Centralised, validated access to environment variables.

Mirrors the old lib/env.ts: a single place for required vars and defaults.
Reads real environment variables (provided by docker compose in production)
and falls back to the repo's .env.local for local development.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict

# Embedding dimensions — fixed by text-embedding-3-large and the DB schema.
EMBEDDING_DIMENSIONS = 3072


class Settings(BaseSettings):
    openai_api_key: str
    openai_embed_model: str = "text-embedding-3-large"
    openai_chat_model: str = "gpt-4o"
    # Postgres connection string (with pgvector). Local Docker or Supabase direct.
    database_url: str
    # Origin allowed by CORS (the Next frontend).
    web_origin: str = "http://localhost:3000"

    # Local dev: pick up the repo-root .env.local when running from backend/.
    model_config = SettingsConfigDict(env_file="../.env.local", extra="ignore")


settings = Settings()  # type: ignore[call-arg]
