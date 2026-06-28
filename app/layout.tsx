import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mind Clone Studio',
  description: 'Crie o clone digital da mente de qualquer pessoa: alimente com documentos, converse e analise com RAG.',
  keywords: 'digital clone, mind clone, IA, RAG, persona, embeddings, connectome',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
