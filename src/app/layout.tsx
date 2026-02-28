import type { Metadata } from 'next'
import { Noto_Sans, Newsreader } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-sans',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

import SmoothScroll from '@/components/SmoothScroll'
import ScrollProgress from '@/components/ScrollProgress'
import PageLoader from '@/components/PageLoader'

export const metadata: Metadata = {
  title: 'DEXTRA 2026 - Beyond Boundaries Hero',
  description: 'DEXTRA Arts Fest 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${notoSans.variable} ${newsreader.variable} font-sans antialiased relative`}>
        <PageLoader />
        <ScrollProgress />
        <SmoothScroll>
          <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}
