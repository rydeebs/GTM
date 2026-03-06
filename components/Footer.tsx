import Link from 'next/link'
import Image from 'next/image'
import { Compass, Building2, Share2, Scale, Twitter, Linkedin, Github, Mail } from 'lucide-react'

const sections = [
  {
    title: 'Explore',
    icon: Compass,
    links: [
      { label: 'Browse Flows', href: '/flows' },
      { label: 'Flow of the Day', href: '/flow-of-the-day' },
      { label: 'Top Flows', href: '/flows?sort=top' },
      { label: 'Submit a Flow', href: '/submit' },
    ],
  },
  {
    title: 'Company',
    icon: Building2,
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Connect',
    icon: Share2,
    links: [
      { label: 'Twitter/X', href: 'https://twitter.com', icon: Twitter },
      { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
      { label: 'GitHub', href: 'https://github.com', icon: Github },
      { label: 'Newsletter', href: '#newsletter', icon: Mail },
    ],
  },
  {
    title: 'Legal',
    icon: Scale,
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-white/[0.08] pt-20 pb-12 px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Trigger Node */}
        <div className="flex flex-col items-center">
          <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 shadow-lg transition-all duration-200 hover:border-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
            <Image
              src="/rungtm-logo.png"
              alt="RunGTM"
              width={90}
              height={20}
              className="h-5 w-auto"
            />
          </div>
          
          {/* Vertical connector from trigger */}
          <div className="w-px h-12 bg-white/[0.15]" />
          
          {/* Branch point circle */}
          <div className="w-2 h-2 rounded-full bg-white/20 border border-white/[0.15]" />
        </div>

        {/* Horizontal connector line */}
        <div className="relative h-px bg-white/[0.15] mx-auto max-w-4xl" />

        {/* Section Nodes Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 max-w-4xl mx-auto">
          {sections.map((section, idx) => (
            <div key={section.title} className="flex flex-col items-center pt-0">
              {/* Vertical connector to node */}
              <div className="w-px h-8 bg-white/[0.15]" />
              
              {/* Connection point */}
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 mb-3" />
              
              {/* Section Node Chip */}
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-1.5 mb-4 transition-all duration-200 hover:border-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
                <section.icon className="w-3 h-3 text-white/40" />
                <span className="text-xs font-semibold text-white/70 tracking-tight">{section.title}</span>
              </div>
              
              {/* Links with dashed connector */}
              <div className="relative pl-4">
                {/* Dashed vertical line */}
                <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dashed border-white/[0.12]" />
                
                <ul className="space-y-2.5">
                  {section.links.map((link, linkIdx) => (
                    <li key={link.label} className="relative">
                      {/* Horizontal dash to link */}
                      <div className="absolute -left-4 top-1/2 w-3 h-px bg-white/[0.12]" />
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/20" />
                      
                      <Link 
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        {'icon' in link && link.icon && <link.icon className="w-3 h-3" />}
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Bottom connector from section */}
              <div className="w-px h-10 bg-white/[0.15] mt-6" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          ))}
        </div>

        {/* Bottom horizontal connector */}
        <div className="relative h-px bg-white/[0.15] mx-auto max-w-4xl" />
        
        {/* Bottom merge point */}
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-white/20 border border-white/[0.15]" />
          <div className="w-px h-8 bg-white/[0.15]" />
          
          {/* Terminating Node */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 mt-0 transition-all duration-200 hover:border-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="text-xs text-white/40 tracking-tight">
              © 2026 RunGTM. All rights reserved.
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
