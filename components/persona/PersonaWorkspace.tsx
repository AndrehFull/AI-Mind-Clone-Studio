'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { ArrowLeft, MessageSquare, BarChart3, BookOpen } from 'lucide-react'
import type { Persona } from '@/lib/types'
import ChatPanel from './ChatPanel'
import AnalysisPanel from './AnalysisPanel'
import KnowledgePanel from './KnowledgePanel'

// Three.js canvas must stay client-only.
const Brain3D = dynamic(() => import('@/components/Brain3D'), { ssr: false })

type Tab = 'chat' | 'analysis' | 'knowledge'

export default function PersonaWorkspace({ persona }: { persona: Persona }) {
  const [tab, setTab] = useState<Tab>('chat')
  const [isProcessing, setIsProcessing] = useState(false)

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare; show: boolean }[] = [
    { key: 'chat', label: 'Conversar', icon: MessageSquare, show: true },
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
          <div className="relative h-[320px] rounded-2xl overflow-hidden hud-border">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ background: 'transparent' }}>
              <Brain3D useRealModel modelUrl="/models/Brain_3d.glb" isProcessing={isProcessing} />
            </Canvas>
          </div>
          <div className="hud-border rounded-2xl p-5 bg-black/30">
            <h1 className="font-orbitron font-bold text-2xl text-white">{persona.name}</h1>
            {persona.title && <p className="text-sm text-neon-cyan mt-1">{persona.title}</p>}
            {persona.description && (
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">{persona.description}</p>
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
              </button>
            ))}
          </div>

          {tab === 'chat' && <ChatPanel persona={persona} onProcessing={setIsProcessing} />}
          {tab === 'analysis' && persona.analysis_prompt && (
            <AnalysisPanel persona={persona} onProcessing={setIsProcessing} />
          )}
          {tab === 'knowledge' && <KnowledgePanel persona={persona} />}
        </div>
      </div>
    </div>
  )
}
