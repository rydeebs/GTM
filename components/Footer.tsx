import Link from 'next/link'
import { Zap, Compass, Building2, Share2, Scale, Twitter, Linkedin, Github, Mail } from 'lucide-react'

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
    <footer className="bg-[#121212] border-t border-white/[0.08] pt-16 pb-10 px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Trigger Node - centered at top */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 shadow-lg relative">
            <div className="w-5 h-5 rounded bg-[#3b82f6]/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#3b82f6]" />
            </div>
            <span className="text-sm font-semibold text-white/90 tracking-tight">RunGTM</span>
            
            {/* Bottom connector dot */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]" />
          </div>
        </div>

        {/* Connector lines from trigger to sections */}
        <div className="relative max-w-4xl mx-auto mb-6">
          {/* Main horizontal line */}
          <div className="absolute top-0 left-[12.5%] right-[12.5%] h-px bg-white/[0.12]" />
          
          {/* Vertical drops to each section - positioned at 25% intervals */}
          <div className="absolute top-0 left-[12.5%] w-px h-6 bg-white/[0.12]" />
          <div className="absolute top-0 left-[37.5%] w-px h-6 bg-white/[0.12]" />
          <div className="absolute top-0 left-[62.5%] w-px h-6 bg-white/[0.12]" />
          <div className="absolute top-0 right-[12.5%] w-px h-6 bg-white/[0.12]" />
          
          {/* Connection dots */}
          <div className="absolute top-6 left-[12.5%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25" />
          <div className="absolute top-6 left-[37.5%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25" />
          <div className="absolute top-6 left-[62.5%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25" />
          <div className="absolute top-6 right-[12.5%] translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25" />
          
          {/* Spacer for the absolute positioned elements */}
          <div className="h-8" />
        </div>

        {/* Section Nodes - horizontal layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 max-w-4xl mx-auto">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col items-center text-center">
              {/* Section Node Chip */}
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-1.5 mb-5">
                <section.icon className="w-3 h-3 text-white/40" />
                <span className="text-xs font-semibold text-white/70 tracking-tight">{section.title}</span>
              </div>
              
              {/* Links */}
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      {'icon' in link && link.icon && <link.icon className="w-3 h-3" />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom terminator */}
        <div className="flex flex-col items-center mt-14">
          {/* Connector line up */}
          <div className="w-px h-6 bg-white/[0.12]" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/25 mb-3" />
          
          {/* Terminating Node */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="text-xs text-white/40 tracking-tight">
              © 2025 RunGTM. All rights reserved.
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
