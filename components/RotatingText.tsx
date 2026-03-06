'use client'

import { useEffect, useState } from 'react'

const phrases = [
  'the best',
  'Winning Outbound',
  'Signal Converting',
  'ICP Prospecting',
  'Strategic LinkedIn',
]

export function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length)
        setIsAnimating(false)
      }, 300)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <span className="relative inline-block overflow-hidden h-[1.1em] align-bottom">
      <span
        className={`block transition-all duration-300 ease-in-out ${
          isAnimating
            ? '-translate-y-full opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        {phrases[currentIndex]}
      </span>
    </span>
  )
}
