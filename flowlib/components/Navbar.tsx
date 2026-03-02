'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = (
    <>
      <Link href="/flows"         className="text-sm hover:opacity-60 transition-opacity">Library</Link>
      <Link href="/flow-of-the-day" className="text-sm hover:opacity-60 transition-opacity">Flow of the Day</Link>
      <Link href="/ideas"         className="text-sm hover:opacity-60 transition-opacity">Ideas</Link>
    </>
  )

  /* ── Floating pill (scrolled) ───────────────────────────────────── */
  if (scrolled) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-6 bg-[#1c1c1c] text-white rounded-full px-6 py-2.5 ring-1 ring-white/10 shadow-2xl shadow-black/40">
          <Link href="/" className="flex items-center gap-1.5 font-semibold text-sm">
            <Zap className="h-4 w-4 text-[#60a5fa]" />
            RunGTM
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            {navLinks}
          </div>
          <Link
            href="/submit"
            className="ml-2 text-xs font-semibold bg-[#3b82f6] text-white px-4 py-1.5 rounded-full hover:bg-[#60a5fa] transition-colors"
          >
            Submit a Flow
          </Link>
        </nav>
      </div>
    )
  }

  /* ── Transparent top bar (at top) ───────────────────────────────── */
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-base">
          <Zap className="h-4 w-4 text-primary" />
          RunGTM
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          {navLinks}
        </div>
        <Link
          href="/submit"
          className="text-xs font-semibold border border-foreground/20 px-4 py-1.5 rounded-full hover:bg-foreground/5 transition-colors"
        >
          Submit a Flow
        </Link>
      </div>
    </nav>
  )
}
