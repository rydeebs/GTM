import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink, Sparkles } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { FlowIdea } from '@/lib/types'

export default async function IdeasPage() {
  const supabase = await createClient()

  // Only show approved/auto-published ideas publicly (linked to published flows)
  const { data: ideas } = await supabase
    .from('flow_ideas')
    .select('*')
    .eq('status', 'approved')
    .order('confidence', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50) as { data: FlowIdea[] | null }

  const platformIcon: Record<string, string> = {
    twitter:  '𝕏',
    reddit:   '🤖',
    linkedin: '💼',
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Flow Ideas
          </h1>
          <p className="text-muted-foreground mt-2">
            Automation ideas discovered from X, Reddit, and LinkedIn —
            processed by Claude and reviewed before publishing.
          </p>
        </div>
      </div>

      {ideas && ideas.length > 0 ? (
        <div className="space-y-4">
          {ideas.map(idea => (
            <div key={idea.id} className="border border-border rounded-xl p-5 bg-white">
              <div className="flex items-start gap-4">
                {/* Platform icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                  {platformIcon[idea.platform] ?? '📡'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-base leading-snug">
                      {idea.extracted_title ?? 'Untitled Flow Idea'}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {Math.round((idea.confidence ?? 0) * 100)}% match
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">{idea.platform}</Badge>
                    </div>
                  </div>

                  {idea.extracted_desc && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{idea.extracted_desc}</p>
                  )}

                  {idea.extracted_tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {idea.extracted_tools.map(t => (
                        <span key={t} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{timeAgo(idea.created_at)}</span>
                      <a href={idea.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary">
                        <ExternalLink className="h-3 w-3" /> Source
                      </a>
                    </div>
                    {idea.published_flow_id && (
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                        <Link href={`/flows/${idea.published_flow_id}`}>View Flow →</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No ideas yet</p>
          <p className="text-sm mt-1">The scraper runs daily — check back soon.</p>
        </div>
      )}
    </div>
  )
}
