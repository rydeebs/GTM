'use client'

import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    num: '01',
    title: 'Browse the Library',
    desc: 'Filter by tool, use case, or category to find exactly what you need.',
  },
  {
    num: '02',
    title: 'Fork the Flow',
    desc: 'Copy any automation into your own stack with a single click.',
  },
  {
    num: '03',
    title: 'Run It',
    desc: 'Connect your tools and go live in minutes, no rebuilding from scratch.',
  },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = sectionRef.current.offsetHeight
      const viewportHeight = window.innerHeight

      // Calculate how far we've scrolled through the section
      const scrolledIntoSection = -rect.top
      const totalScrollableDistance = sectionHeight - viewportHeight
      const scrollProgress = Math.max(0, Math.min(1, scrolledIntoSection / totalScrollableDistance))

      setProgress(scrollProgress)

      // Determine which step is active based on scroll progress
      const stepProgress = scrollProgress * steps.length
      const currentStep = Math.min(Math.floor(stepProgress), steps.length - 1)
      setActiveStep(currentStep)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative bg-[#0d0d0d]"
      style={{ height: `${(steps.length + 0.5) * 100}vh` }}
    >
      {/* Fixed content container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Header */}
        <div className="text-center mb-12 px-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/40 mb-3">
            Get started in minutes
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-heading text-white">
            How It Works
          </h2>
        </div>

        {/* Steps container */}
        <div className="relative w-full max-w-4xl mx-auto px-6 h-[300px] flex items-center justify-center">
          {steps.map((step, i) => {
            // Calculate individual step progress
            const stepStart = i / steps.length
            const stepEnd = (i + 1) / steps.length
            const stepMid = (stepStart + stepEnd) / 2
            
            let opacity = 0
            let translateY = 100
            
            if (progress >= stepStart && progress <= stepEnd) {
              // Step is active
              const localProgress = (progress - stepStart) / (stepEnd - stepStart)
              
              if (localProgress < 0.3) {
                // Entering
                opacity = localProgress / 0.3
                translateY = 100 * (1 - localProgress / 0.3)
              } else if (localProgress > 0.7) {
                // Exiting
                opacity = 1 - (localProgress - 0.7) / 0.3
                translateY = -100 * ((localProgress - 0.7) / 0.3)
              } else {
                // Fully visible
                opacity = 1
                translateY = 0
              }
            }

            return (
              <div
                key={step.num}
                className="absolute inset-x-6 flex flex-col items-center text-center transition-opacity duration-150"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
                }}
              >
                {/* Ghost step number */}
                <span className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 text-[8rem] sm:text-[12rem] font-black text-white/[0.03] leading-none select-none pointer-events-none">
                  {step.num}
                </span>

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 sm:mb-8 mx-auto">
                    <span className="text-base sm:text-lg font-bold text-white/60">{step.num}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed max-w-md mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeStep
                  ? 'bg-[#3b82f6] scale-150'
                  : 'bg-white/20 scale-100'
              }`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/20">
          Scroll
        </div>
      </div>
    </section>
  )
}
