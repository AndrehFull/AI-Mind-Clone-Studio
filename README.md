# 🧠 Mind Clone Studio

Plataforma open source para criar o **clone digital da mente de qualquer pessoa**. Você cadastra uma _persona_, alimenta ela com documentos (PDF, texto, transcrições), e então **conversa** com o clone ou pede uma **análise estruturada** — tudo com RAG (Retrieval-Augmented Generation) sobre a base de conhecimento daquela pessoa.

> O clone de **Eugene Schwartz** (lendário copywriter, autor de _Breakthrough Advertising_) vem como persona de exemplo.

---

## ✨ Recursos

- **Múltiplas personas** — cada uma com nome, voz (system prompt) e sua própria base de conhecimento.
- **Conversar** — chat com streaming, respostas ancoradas nos documentos da persona.
- **Análise estruturada** — para personas que habilitam, devolve JSON validado (ex.: análise de leads do Eugene).
- **Conhecimento no próprio app** — cole texto ou suba arquivos (PDF/TXT/MD); o app faz _chunk → embedding → Postgres_ automaticamente.
- **100% em código** — sem n8n, sem webhooks externos. Você roda com suas próprias chaves.
- **Sobe com Docker** — `docker compose up` levanta app + Postgres/pgvector com schema e seed automáticos.

## 🏗️ Arquitetura

```
Next.js 14 (App Router)
 ├─ app/api/personas/...      → REST: CRUD de personas, documentos, chat, análise
 ├─ lib/                      → openai (embeddings/chat), rag, ingest, supabase, chunk
 └─ components/               → UI (grid, workspace 3D, chat, análise, conhecimento)

OpenAI        → embeddings (text-embedding-3-large, 3072 dims) + chat
Postgres      → pgvector (tabelas personas e documents), via driver `pg`
```

Pipeline de runtime (igual ao antigo fluxo n8n, agora em código):

`lead/pergunta → embedding (OpenAI) → match_documents (pgvector, filtrado por persona) → contexto → chat/JSON (OpenAI) → resposta`

## 🐳 Subindo com Docker (recomendado para testar)

```bash
cp .env.example .env.local      # preencha OPENAI_API_KEY
npm run docker:up               # = docker compose up --build
```
Isso sobe o app + um Postgres com pgvector totalmente local (o `db/schema.sql` e o `db/seed.sql` rodam automaticamente na primeira vez). Acesse http://localhost:3000.

### Scripts disponíveis
| Script | O que faz |
|--------|-----------|
| `npm run docker:up` | sobe app + banco |
| `npm run docker:down` | derruba os containers |
| `npm run docker:reset` | derruba **e apaga o volume** do banco (re-seed do zero) |
| `npm run docker:logs` | segue os logs (debug) |

> Só o banco é local — os embeddings e o chat continuam usando a API da OpenAI, então a `OPENAI_API_KEY` é obrigatória.

Para ingerir documentos em massa contra o banco do compose:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mindclone \
  npm run ingest -- --persona eugene-schwartz ./livro.pdf
```

## 🚀 Começando (sem Docker)

### 1. Pré-requisitos
- Node.js 18+
- Uma conta [OpenAI](https://platform.openai.com/) (API key)
- Um Postgres com **pgvector**: um local (`pgvector/pgvector`) ou um projeto [Supabase](https://supabase.com/)

### 2. Instalar
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```
Preencha `.env.local` com a `OPENAI_API_KEY` e a `DATABASE_URL` do seu Postgres.

### 4. Rodar (modo dev com hot-reload)
```bash
npm run dev
```
`npm run dev` **sobe o Postgres local no Docker automaticamente** (via `predev`) e inicia o Next com hot-reload em http://localhost:3000. Na primeira vez o banco já é criado e populado pelo `db/schema.sql` + `db/seed.sql`.

> **Usando um Postgres externo (ex.: Supabase)?** Rode o schema/seed nele uma vez
> (`psql "$DATABASE_URL" -f db/schema.sql` e `-f db/seed.sql`, ou cole no SQL Editor),
> ajuste a `DATABASE_URL` no `.env.local` e rode `npx next dev` (sem o `predev`, que sobe o banco local).

## 📚 Adicionando conhecimento

**Pelo app:** abra uma persona → aba **Conhecimento** → cole texto ou suba um arquivo.

**Em massa (CLI):**
```bash
npm run ingest -- --persona eugene-schwartz ./caminho/para/livro.pdf
npm run ingest -- --persona eugene-schwartz ./pasta-com-documentos
```

## 🔌 API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET/POST` | `/api/personas` | listar / criar personas |
| `GET/PATCH/DELETE` | `/api/personas/:id` | obter / editar / excluir |
| `GET/POST/DELETE` | `/api/personas/:id/documents` | fontes / adicionar texto / remover fonte |
| `POST` | `/api/personas/:id/documents/upload` | subir arquivo (multipart) |
| `POST` | `/api/personas/:id/chat` | chat (stream de texto) |
| `POST` | `/api/personas/:id/analyze` | análise estruturada (JSON) |

## ⚙️ Configuração

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENAI_API_KEY` | — | chave da OpenAI (embeddings + chat) |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-large` | **deve** casar com a dimensão 3072 do schema |
| `OPENAI_CHAT_MODEL` | `gpt-4o` | qualquer modelo de chat da OpenAI (ex.: `gpt-5`) |
| `DATABASE_URL` | — | string de conexão Postgres+pgvector (local ou Supabase direct connection) |

> **Nota sobre embeddings:** a tabela `documents` usa `vector(3072)`. Se trocar para `text-embedding-3-small` (1536 dims), ajuste o schema. O pgvector não indexa vetores com mais de 2000 dimensões, então a busca em 3072 é sequencial (ok para bases por-persona).

## 📁 Estrutura
```
app/            páginas (home, /personas/new, /personas/[id]) + API routes
components/     UI: PersonaCard, PersonaForm, persona/* (workspace, chat, análise, conhecimento), Brain3D
lib/            openai, supabase, rag, ingest, chunk, personas, documents, env, types
db/             schema.sql, seed.sql
scripts/        ingest.ts (CLI)
```

## 📄 Licença
MIT.
