'use client'

import Link from 'next/link'
import { ArrowUp, Bookmark, GitFork, Clock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { timeAgo, formatMinutes } from '@/lib/utils'
import { toast } from '@/lib/hooks/use-toast'
import type { Flow } from '@/lib/types'

interface FlowCardProps {
  flow:       Flow
  userVoted?: boolean
  userSaved?: boolean
  onVote?:    (flowId: string) => void
  onSave?:    (flowId: string) => void
}

export function FlowCard({ flow, userVoted, userSaved, onVote, onSave }: FlowCardProps) {
  async function handleVote(e: React.MouseEvent) {
    e.preventDefault()
    if (onVote) {
      onVote(flow.id)
    } else {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_id: flow.id }),
      })
      if (res.ok) toast({ title: 'Upvoted!' })
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (onSave) {
      onSave(flow.id)
    } else {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_id: flow.id }),
      })
      if (res.ok) toast({ title: 'Saved to your collection!' })
    }
  }

  return (
    <Link href={`/flows/${flow.id}`} className="block group">
      <div className="border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {flow.title}
          </h3>
          <Badge variant="outline" className="shrink-0 text-xs">{flow.category}</Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{flow.description}</p>

        {/* Tools */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {flow.tools.slice(0, 5).map(tool => (
            <span key={tool} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {tool}
            </span>
          ))}
          {flow.tools.length > 5 && (
            <span className="text-xs text-muted-foreground">+{flow.tools.length - 5}</span>
          )}
        </div>

        {/* Steps preview */}
        {flow.steps.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 overflow-hidden">
            {flow.steps.slice(0, 4).map((step, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>→</span>}
                <span className="bg-secondary px-1.5 py-0.5 rounded truncate max-w-[90px]">{step.app}</span>
              </span>
            ))}
            {flow.steps.length > 4 && <span>→ +{flow.steps.length - 4} more</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {flow.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMinutes(flow.estimated_minutes)} to build
              </span>
            )}
            <span>{timeAgo(flow.created_at)}</span>
            {flow.author_name && <span>by {flow.author_name}</span>}
          </div>

          <div className="flex items-center gap-1">
            {/* Fork count */}
            {flow.fork_count > 0 && (
              <span className="flex items-center gap-0.5 px-2 py-1 rounded-md text-xs">
                <GitFork className="h-3 w-3" />
                {flow.fork_count}
              </span>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${userSaved ? 'text-primary' : ''}`}
              title="Save"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>

            {/* Upvote */}
            <button
              onClick={handleVote}
              className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary transition-colors ${userVoted ? 'text-primary font-semibold' : ''}`}
              title="Upvote"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {flow.vote_count}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
