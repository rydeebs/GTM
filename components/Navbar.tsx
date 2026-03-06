'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function Navbar() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrolled    = scrollY > 60   // pill
  const anyScrolled = scrollY > 0    // full-width bar gets glass bg

  const navLinks = (scrolled: boolean) => (
    <>
      <Link href="/flows" className={`text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${scrolled ? 'hover:bg-gray-200 hover:text-gray-900' : 'hover:bg-white/20 hover:text-white'}`}>Library</Link>
      <Link href="/ideas" className={`text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${scrolled ? 'hover:bg-gray-200 hover:text-gray-900' : 'hover:bg-white/20 hover:text-white'}`}>Ideas</Link>
    </>
  )

  /* ── Floating pill (scrolled > 60px) ───────────────────────────── */
  if (scrolled) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-6 bg-white/70 backdrop-blur-md text-gray-900 rounded-full px-6 py-2.5 ring-1 ring-black/10 shadow-2xl shadow-black/10 transition-all duration-200 hover:ring-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
          <Link href="/" className="flex items-center">
            <Image src="/whitelogo.png" alt="RunGTM" width={90} height={22} className="h-5 w-auto" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }} />
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            {navLinks(true)}
          </div>
          <Link
            href="/submit"
            className="ml-2 text-xs font-semibold tracking-widest uppercase bg-[#3b82f6] text-white px-4 py-1.5 rounded-full hover:bg-[#60a5fa] transition-colors"
          >
            New +
          </Link>
        </nav>
      </div>
    )
  }

  /* ── Full-width top bar (dark background until pill) ─────────────── */
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 bg-[#121212] text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="RunGTM"
            width={120}
            height={28}
            className="h-7 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
          />
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-white">
          {navLinks(false)}
        </div>
        <Link
          href="/submit"
          className="text-xs font-semibold tracking-widest uppercase border border-white/30 text-white px-4 py-1.5 rounded-full hover:bg-white hover:text-gray-900 transition-all"
        >
          New +
        </Link>
      </div>
    </nav>
  )
}
