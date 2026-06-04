/**
 * Lightweight recursive character text splitter.
 *
 * Mirrors the behaviour the n8n pipeline relied on (chunk ~1000, overlap ~200):
 * split on the largest natural separator that keeps chunks under `chunkSize`,
 * falling back to ever-smaller separators, then stitch overlap between chunks.
 */

export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
}

const SEPARATORS = ['\n\n', '\n', '. ', ' ', '']

function splitRecursive(text: string, chunkSize: number, seps: string[]): string[] {
  if (text.length <= chunkSize) return [text]

  const [sep, ...rest] = seps
  // No separators left: hard-split by size.
  if (sep === undefined) {
    const pieces: string[] = []
    for (let i = 0; i < text.length; i += chunkSize) {
      pieces.push(text.slice(i, i + chunkSize))
    }
    return pieces
  }

  const parts = sep === '' ? text.split('') : text.split(sep)
  const chunks: string[] = []
  let current = ''

  for (const part of parts) {
    const candidate = current ? current + sep + part : part
    if (candidate.length <= chunkSize) {
      current = candidate
    } else {
      if (current) chunks.push(current)
      // The part itself is too big — recurse with a finer separator.
      if (part.length > chunkSize) {
        chunks.push(...splitRecursive(part, chunkSize, rest))
        current = ''
      } else {
        current = part
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const chunkSize = opts.chunkSize ?? 1000
  const chunkOverlap = opts.chunkOverlap ?? 200
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const raw = splitRecursive(normalized, chunkSize, SEPARATORS)
    .map((c) => c.trim())
    .filter(Boolean)

  if (chunkOverlap <= 0 || raw.length <= 1) return raw

  // Prepend a tail of the previous chunk to each chunk for context overlap.
  return raw.map((chunk, i) => {
    if (i === 0) return chunk
    const prevTail = raw[i - 1].slice(-chunkOverlap)
    return `${prevTail} ${chunk}`.trim()
  })
}
