'use client'

import Link from 'next/link'
import { ArrowUp, Bookmark, GitFork, Clock } from 'lucide-react'
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
      <div className="bg-white border border-foreground/8 p-6 hover:border-[#3b82f6]/30 hover:shadow-sm transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-foreground/40 border border-foreground/12 px-2 py-0.5 rounded-full">
            {flow.category}
          </span>
          <span className="text-[11px] text-foreground/30 flex items-center gap-0.5 shrink-0">
            <ArrowUp className="h-3 w-3" />{flow.vote_count}
          </span>
        </div>

        <h3 className="font-bold text-base leading-snug group-hover:text-[#3b82f6] transition-colors line-clamp-2 mb-2">
          {flow.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-foreground/45 line-clamp-2 mb-4">{flow.description}</p>

        {/* Tools */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {flow.tools.slice(0, 5).map(tool => (
            <span key={tool} className="text-[10px] bg-foreground/5 text-foreground/45 px-2 py-0.5 rounded-full">
              {tool}
            </span>
          ))}
          {flow.tools.length > 5 && (
            <span className="text-[10px] text-foreground/30">+{flow.tools.length - 5}</span>
          )}
        </div>

        {/* Steps preview */}
        {flow.steps.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-foreground/30 mb-4 overflow-hidden">
            {flow.steps.slice(0, 4).map((step, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>→</span>}
                <span className="bg-foreground/5 px-1.5 py-0.5 rounded truncate max-w-[80px]">{step.app}</span>
              </span>
            ))}
            {flow.steps.length > 4 && <span>→ +{flow.steps.length - 4}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-dashed border-foreground/8 text-[11px] text-foreground/30">
          <div className="flex items-center gap-3">
            {flow.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMinutes(flow.estimated_minutes)}
              </span>
            )}
            {flow.author_name && <span>by {flow.author_name}</span>}
          </div>

          <div className="flex items-center gap-1">
            {flow.fork_count > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-1">
                <GitFork className="h-3 w-3" />{flow.fork_count}
              </span>
            )}
            <button
              onClick={handleSave}
              className={`p-1.5 hover:text-foreground/60 transition-colors ${userSaved ? 'text-[#3b82f6]' : ''}`}
              title="Save"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleVote}
              className={`flex items-center gap-1 px-1.5 py-1 hover:text-foreground/60 transition-colors ${userVoted ? 'text-[#3b82f6] font-semibold' : ''}`}
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
