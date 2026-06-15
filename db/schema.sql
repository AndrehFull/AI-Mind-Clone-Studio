-- ============================================================================
-- Mind Clone Studio — database schema (Supabase / Postgres + pgvector)
-- Run this once on a fresh database (Supabase SQL editor or psql).
-- ============================================================================

-- Required extensions ---------------------------------------------------------
create extension if not exists vector;     -- pgvector: embeddings + similarity
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- personas: one row per digital clone (a person whose "mind" we reproduce)
-- ----------------------------------------------------------------------------
create table if not exists personas (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,          -- url-friendly identifier
  name            text not null,
  title           text,                          -- short tagline / role
  description     text,                          -- shown on the persona card
  avatar_url      text,
  system_prompt   text not null,                 -- how the clone thinks/speaks
  analysis_prompt text,                          -- enables structured-analysis mode
  analysis_schema jsonb,                          -- example JSON of the analysis output
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- documents: the knowledge base. Each row is a chunk of a source document,
-- vectorised with OpenAI text-embedding-3-large (3072 dims) and tied to a persona.
-- ----------------------------------------------------------------------------
create table if not exists documents (
  id          bigserial primary key,
  persona_id  uuid references personas(id) on delete cascade,
  content     text,                              -- chunk text
  metadata    jsonb not null default '{}'::jsonb, -- { source, chunk_index, ... }
  embedding   vector(3072),                      -- text-embedding-3-large
  created_at  timestamptz not null default now()
);

create index if not exists documents_persona_id_idx on documents (persona_id);

-- NOTE: pgvector's ivfflat/hnsw indexes support a maximum of 2000 dimensions,
-- so a 3072-dim column cannot be indexed and falls back to a sequential scan.
-- That is fine for a per-persona knowledge base. If you need ANN indexing at
-- scale, switch to text-embedding-3-small (1536 dims) here and in .env.

-- ----------------------------------------------------------------------------
-- match_documents: semantic search over a single persona's knowledge base.
-- Returns the top `match_count` chunks ordered by cosine similarity.
-- ----------------------------------------------------------------------------
create or replace function match_documents (
  query_embedding   vector(3072),
  match_count       int  default 8,
  filter_persona_id uuid default null
)
returns table (
  id         bigint,
  content    text,
  metadata   jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where filter_persona_id is null or d.persona_id = filter_persona_id
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- keep personas.updated_at fresh on every update
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists personas_set_updated_at on personas;
create trigger personas_set_updated_at
  before update on personas
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Identity layer (profile). Added via idempotent ALTERs so this file stays the
-- single source of truth: re-run `psql -f db/schema.sql` (npm run migrate) on an
-- existing database to upgrade it without losing data.
--   profile        = approved identity, injected into every prompt
--   profile_draft  = pending AI proposal awaiting human approval (null = none)
--   profile_meta   = per-field provenance ('human' | 'distilled') for merge
-- ----------------------------------------------------------------------------
alter table personas add column if not exists profile            jsonb;
alter table personas add column if not exists profile_draft      jsonb;
alter table personas add column if not exists profile_meta       jsonb;
alter table personas add column if not exists profile_updated_at timestamptz;
alter table personas add column if not exists consent_ack        boolean not null default false;
