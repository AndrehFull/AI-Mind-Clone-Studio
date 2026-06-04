import Link from 'next/link'
import { Brain, MessageSquare, FileText } from 'lucide-react'
import type { Persona } from '@/lib/types'

export default function PersonaCard({
  persona,
}: {
  persona: Persona & { document_count?: number }
}) {
  return (
    <Link href={`/personas/${persona.id}`} className="group block">
      <div className="hud-border rounded-2xl p-6 h-full bg-black/30 backdrop-blur-sm transition-all duration-300 group-hover:border-neon-blue/60 group-hover:-translate-y-1">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-neon-blue/10 border border-neon-blue/40 overflow-hidden">
            {persona.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
            ) : (
              <Brain className="w-7 h-7 text-neon-blue" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-orbitron font-bold text-lg text-white truncate group-hover:text-neon-cyan transition-colors">
              {persona.name}
            </h3>
            {persona.title && (
              <p className="text-xs text-gray-400 truncate">{persona.title}</p>
            )}
          </div>
        </div>

        {persona.description && (
          <p className="text-sm text-gray-300 line-clamp-3 mb-4">{persona.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {persona.document_count ?? 0} trechos
          </span>
          {persona.analysis_prompt && (
            <span className="flex items-center gap-1 text-neon-purple">
              <MessageSquare className="w-3.5 h-3.5" /> análise
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
