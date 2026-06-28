'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'
import type { ChatMessage, Persona } from '@/lib/types'

export default function ChatPanel({
  persona,
  onProcessing,
}: {
  persona: Persona
  onProcessing: (v: boolean) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)
    setError(null)
    onProcessing(true)

    try {
      const res = await apiFetch(`/personas/${persona.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: acc }
          return copy
        })
      }
    } catch (err) {
      setError((err as Error).message)
      setMessages((prev) => prev.slice(0, -1)) // drop the empty assistant bubble
    } finally {
      setStreaming(false)
      onProcessing(false)
    }
  }

  return (
    <div className="hud-border rounded-2xl bg-black/30 flex flex-col h-[560px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-gray-500 text-sm px-6">
            Comece uma conversa com {persona.name}. As respostas usam os documentos da base como memória.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-neon-blue/20 border border-neon-blue/40 text-white'
                  : 'bg-black/40 border border-gray-700 text-gray-200'
              }`}
            >
              {m.role === 'assistant' && m.content === '' ? (
                <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-neon-cyan">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="px-5 text-sm text-red-400">{error}</p>}

      <div className="p-4 border-t border-gray-800 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={`Pergunte algo a ${persona.name}...`}
          className="min-h-[52px] max-h-40"
        />
        <Button onClick={send} variant="neon" size="icon" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )
}
