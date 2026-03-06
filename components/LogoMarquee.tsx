'use client'

import { useEffect, useRef } from 'react'

const logos = [
  'Clay', 'Apollo', 'Zapier', 'Make', 'n8n', 'HubSpot', 
  'Salesforce', 'Instantly', 'Smartlead', 'HeyReach', 
  'Lemlist', 'LinkedIn', 'Slack', 'Notion', 'Outreach', 'Salesloft'
]

// Split logos into two rows
const row1 = logos.slice(0, 8)
const row2 = logos.slice(8, 16)

export function LogoMarquee() {
  return (
    <div className="w-full mt-16">
      {/* Section header */}
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/40 mb-2">
          Integrations
        </p>
        <h3 className="text-xl font-bold tracking-tight mb-2">
          Works with your entire stack
        </h3>
        <p className="text-sm text-foreground/40">
          Connect any tool. Automate any motion.
        </p>
      </div>

      {/* Marquee container with fade masks */}
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Row 1 - scrolling left */}
        <div className="flex mb-3 marquee-row-1">
          <div className="flex shrink-0 animate-marquee-left">
            {[...row1, ...row1].map((logo, i) => (
              <LogoCard key={`r1-${i}`} name={logo} />
            ))}
          </div>
          <div className="flex shrink-0 animate-marquee-left" aria-hidden="true">
            {[...row1, ...row1].map((logo, i) => (
              <LogoCard key={`r1-dup-${i}`} name={logo} />
            ))}
          </div>
        </div>

        {/* Row 2 - scrolling right */}
        <div className="flex marquee-row-2">
          <div className="flex shrink-0 animate-marquee-right">
            {[...row2, ...row2].map((logo, i) => (
              <LogoCard key={`r2-${i}`} name={logo} />
            ))}
          </div>
          <div className="flex shrink-0 animate-marquee-right" aria-hidden="true">
            {[...row2, ...row2].map((logo, i) => (
              <LogoCard key={`r2-dup-${i}`} name={logo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoCard({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-12 px-6 mx-2 rounded-lg border border-foreground/8 bg-foreground/[0.02] text-foreground/40 hover:text-foreground hover:border-foreground/20 transition-all duration-300 cursor-default group">
      <span className="text-sm font-medium tracking-tight whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
        {name}
      </span>
    </div>
  )
}
