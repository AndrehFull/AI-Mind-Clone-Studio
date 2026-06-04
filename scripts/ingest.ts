/**
 * Bulk knowledge ingestion CLI.
 *
 *   npm run ingest -- --persona <slug-or-id> <file-or-dir> [more files...]
 *
 * Examples:
 *   npm run ingest -- --persona eugene-schwartz ./books/breakthrough.pdf
 *   npm run ingest -- --persona eugene-schwartz ./knowledge   (all files in a dir)
 *
 * Reads OPENAI_* and DATABASE_URL from .env.local (same as the app).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { loadEnvConfig } from '@next/env'

// Load env BEFORE importing modules that read it.
loadEnvConfig(process.cwd())

async function main() {
  const { queryOne, getPool } = await import('../lib/db')
  const { ingestText, extractText } = await import('../lib/ingest')

  const args = process.argv.slice(2)
  const personaIdx = args.indexOf('--persona')
  if (personaIdx === -1 || !args[personaIdx + 1]) {
    console.error('Uso: npm run ingest -- --persona <slug-ou-id> <arquivo-ou-pasta> [...]')
    process.exit(1)
  }
  const personaRef = args[personaIdx + 1]
  const paths = args.filter((a, i) => i !== personaIdx && i !== personaIdx + 1 && !a.startsWith('--'))
  if (paths.length === 0) {
    console.error('Nenhum arquivo/pasta informado.')
    process.exit(1)
  }

  // Resolve persona by slug or id (id cast guarded so a slug doesn't break ::uuid).
  const persona = await queryOne<{ id: string; name: string; slug: string }>(
    `select id, name, slug from personas
      where slug = $1 or id::text = $1
      limit 1`,
    [personaRef]
  )

  if (!persona) {
    console.error(`Persona não encontrada: ${personaRef}`)
    process.exit(1)
  }
  console.log(`→ Persona: ${persona.name} (${persona.slug})`)

  // Expand directories into their files.
  const files: string[] = []
  for (const p of paths) {
    if (statSync(p).isDirectory()) {
      for (const f of readdirSync(p)) files.push(join(p, f))
    } else {
      files.push(p)
    }
  }

  for (const file of files) {
    try {
      const buffer = readFileSync(file)
      const text = await extractText(buffer, basename(file))
      if (!text.trim()) {
        console.warn(`  ⚠ ${basename(file)}: sem texto extraível, pulado.`)
        continue
      }
      const result = await ingestText(persona.id, text, basename(file))
      console.log(`  ✓ ${basename(file)}: ${result.chunks} trechos indexados.`)
    } catch (err) {
      console.error(`  ✗ ${basename(file)}: ${(err as Error).message}`)
    }
  }

  console.log('Concluído.')
  await getPool().end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
