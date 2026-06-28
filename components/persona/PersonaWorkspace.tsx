'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, BarChart3, BookOpen, Fingerprint } from 'lucide-react'
import type { Persona } from '@/lib/types'
import BrainScene from '@/components/brain/BrainScene'
import { SceneOverlays } from '@/components/brain/overlays'
import ChatPanel from './ChatPanel'
import AnalysisPanel from './AnalysisPanel'
import KnowledgePanel from './KnowledgePanel'
import ProfilePanel from './ProfilePanel'

type Tab = 'chat' | 'profile' | 'analysis' | 'knowledge'

export default function PersonaWorkspace({ persona }: { persona: Persona }) {
  const [tab, setTab] = useState<Tab>('chat')
  const [isProcessing, setIsProcessing] = useState(false)

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare; show: boolean; badge?: boolean }[] = [
    { key: 'chat', label: 'Conversar', icon: MessageSquare, show: true },
    { key: 'profile', label: 'Perfil', icon: Fingerprint, show: true, badge: !!persona.profile_draft },
    { key: 'analysis', label: 'Análise', icon: BarChart3, show: !!persona.analysis_prompt },
    { key: 'knowledge', label: 'Conhecimento', icon: BookOpen, show: true },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon-cyan mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Todas as personas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
        {/* Left: 3D brain + identity */}
        <div className="space-y-4">
          <div className="relative h-[320px] rounded-2xl overflow-hidden glass">
            <BrainScene fixed={false} motion={isProcessing ? 'intense' : 'calm'} />
          </div>
          <div className="glass rounded-2xl p-5">
            <h1 className="font-semibold text-2xl text-c-ink">{persona.name}</h1>
            {persona.title && <p className="text-sm text-c-accent mt-1">{persona.title}</p>}
            {persona.description && (
              <p className="text-sm text-c-ink2 mt-3 leading-relaxed">{persona.description}</p>
            )}
          </div>
        </div>

        {/* Right: tabbed workspace */}
        <div>
          <div className="flex gap-2 mb-5">
            {tabs.filter((t) => t.show).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-orbitron transition-all ${
                  tab === t.key
                    ? 'bg-neon-blue/20 text-neon-cyan border border-neon-blue/50'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
                {t.badge && (
                  <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse-neon" aria-label="proposta pendente" />
                )}
              </button>
            ))}
          </div>

          {tab === 'chat' && <ChatPanel persona={persona} onProcessing={setIsProcessing} />}
          {tab === 'profile' && <ProfilePanel persona={persona} onProcessing={setIsProcessing} />}
          {tab === 'analysis' && persona.analysis_prompt && (
            <AnalysisPanel persona={persona} onProcessing={setIsProcessing} />
          )}
          {tab === 'knowledge' && <KnowledgePanel persona={persona} />}
        </div>
      </div>
    </div>
  )
}
