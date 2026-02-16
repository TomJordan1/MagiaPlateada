import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif' })

export const metadata: Metadata = {
  title: 'Magia Plateada - Conecta con la experiencia',
  description: 'Plataforma que conecta adultos mayores expertos con personas que necesitan sus servicios. Experiencia, sabiduría y confianza.',
}

export const viewport: Viewport = {
  themeColor: '#6B7280',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${dmSerif.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
