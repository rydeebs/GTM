import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Zap className="h-5 w-5" />
            FlowLib
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Link href="/flows" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              Library
            </Link>
            <Link href="/flow-of-the-day" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              Flow of the Day
            </Link>
            <Link href="/ideas" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              Ideas
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href="/submit">Submit a Flow</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
