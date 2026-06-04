import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata: Metadata = {
  title: 'Mind Clone Studio',
  description: 'Crie o clone digital da mente de qualquer pessoa: alimente com documentos, converse e analise com RAG.',
  keywords: 'digital clone, mind clone, IA, RAG, persona, embeddings, copywriting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
