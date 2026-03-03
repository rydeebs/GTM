'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

// ── Animation helpers ─────────────────────────────────────────────────────────

/** Fade + unblur + rise in. Wraps children in a motion.div. */
function BlurIn({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Single word that rises from y:40 → 0 with opacity. */
function Word({
  word,
  delay,
  duration = 0.6,
  className,
}: {
  word: string
  delay: number
  duration?: number
  className?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {word}
    </motion.span>
  )
}

// Convenience: compute staggered delay for global word index i
const D = (i: number) => i * 0.08

// ── HLS video ─────────────────────────────────────────────────────────────────

const VIDEO_SRC =
  'https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8'

function HLSVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef   = useRef<{ destroy(): void } | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari: native HLS
      video.src = VIDEO_SRC
      video.play().catch(() => {})
    } else {
      // Chrome / Firefox: hls.js
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) return
        const hls = new Hls({ enableWorker: false })
        hlsRef.current = hls
        hls.loadSource(VIDEO_SRC)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })
      })
    }

    return () => hlsRef.current?.destroy()
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute top-0 left-0 h-full object-cover"
      style={{
        marginLeft: '200px',
        width: 'calc(100% - 200px)',
        transform: 'scale(1.2)',
        transformOrigin: 'left center',
      }}
    />
  )
}

// ── Hero section ──────────────────────────────────────────────────────────────

// Heading word groups — indices are global across all three lines for stagger
const LINE1 = ['Unlock', 'the', 'Power', 'of', 'AI']   // words 0-4
const LINE2 = ['for', 'Your']                            // words 5-6
// 'Business.'                                           // word 7

export function HeroSection() {
  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: '#070612' }}
    >
      {/* ── Video (z-0) ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <HLSVideo />
      </div>

      {/* ── Bottom fade (z-10) ──────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 z-10"
        style={{ background: 'linear-gradient(to top, #070612, transparent)' }}
      />

      {/* ── Content (z-20) ──────────────────────────────────────── */}
      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-12">
          <div className="flex flex-col gap-12">

            {/* Badge + Heading + Subtitle */}
            <div className="flex flex-col gap-6">

              {/* Badge */}
              <BlurIn delay={0} className="inline-block">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 backdrop-blur-sm px-4 py-2">
                  <Sparkles className="w-3 h-3 text-white/80" />
                  <span className="text-sm font-medium text-white/80">
                    New AI Automation Ally
                  </span>
                </div>
              </BlurIn>

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight lg:leading-[1.2] text-white max-w-2xl">

                {/* Line 1 — block */}
                <span className="block">
                  {LINE1.map((word, i) => (
                    <span key={word} className="inline-block mr-[0.28em]">
                      <Word word={word} delay={D(i)} />
                    </span>
                  ))}
                </span>

                {/* Line 2 — inline */}
                {LINE2.map((word, i) => (
                  <span key={word} className="inline-block mr-[0.28em]">
                    <Word word={word} delay={D(5 + i)} />
                  </span>
                ))}

                {/* Line 3 — serif italic, inline */}
                <span className="inline-block font-serif italic">
                  <Word word="Business." delay={D(7)} />
                </span>
              </h1>

              {/* Subtitle */}
              <BlurIn delay={0.4} className="max-w-xl">
                <p className="text-white/80 text-lg font-normal leading-relaxed">
                  Our cutting-edge AI platform automates, analyzes, and
                  accelerates your workflows so you can focus on what really
                  matters.
                </p>
              </BlurIn>
            </div>

            {/* CTA buttons */}
            <BlurIn delay={0.6} className="inline-block">
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/book-call"
                  className="inline-flex items-center gap-2 bg-[#3b82f6] text-white font-medium rounded-full px-5 py-3 hover:bg-[#60a5fa] active:bg-[#1d4ed8] transition-colors duration-200"
                >
                  Book A Free Call
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/learn"
                  className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white font-medium rounded-full px-8 py-3 border border-transparent hover:bg-blue-500/20 hover:border-blue-400/40 transition-colors duration-200"
                >
                  Learn now
                </Link>
              </div>
            </BlurIn>

          </div>
        </div>
      </div>
    </section>
  )
}
