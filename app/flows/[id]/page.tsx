import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowUp, Bookmark, GitFork, Clock, ExternalLink, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FlowDiagram } from '@/components/FlowDiagram'
import { formatMinutes, stepsTodiagram, timeAgo } from '@/lib/utils'
import type { Flow } from '@/lib/types'

interface Props { params: { id: string } }

export default async function FlowDetailPage({ params }: Props) {
  const supabase = await createClient()

  const { data: flow, error } = await supabase
    .from('flows')
    .select('*')
    .eq('id', params.id)
    .single() as { data: Flow | null; error: any }

  if (error || !flow) notFound()

  const diagram = flow.diagram_data ?? stepsTodiagram(flow.steps)

  // Get original if forked
  let forkedFrom: Flow | null = null
  if (flow.forked_from) {
    const { data } = await supabase.from('flows').select('id,title').eq('id', flow.forked_from).single()
    forkedFrom = data as Flow | null
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/flows" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Library
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{flow.category}</Badge>
            {flow.is_featured && <Badge>⭐ Featured</Badge>}
            {flow.forked_from && forkedFrom && (
              <span className="text-xs text-muted-foreground">
                Forked from <Link href={`/flows/${forkedFrom.id}`} className="text-primary hover:underline">{forkedFrom.title}</Link>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">{flow.title}</h1>
          <p className="text-muted-foreground text-base leading-relaxed">{flow.description}</p>
        </div>

        <div className="flex sm:flex-col items-center gap-2">
          {/* Upvote */}
          <form action="/api/votes" method="post">
            <input type="hidden" name="flow_id" value={flow.id} />
            <button className="flex flex-col items-center gap-0.5 p-3 rounded-xl border border-border hover:border-primary hover:text-primary transition-all">
              <ArrowUp className="h-5 w-5" />
              <span className="text-sm font-semibold">{flow.vote_count}</span>
            </button>
          </form>

          {/* Save */}
          <form action="/api/saves" method="post">
            <input type="hidden" name="flow_id" value={flow.id} />
            <button className="flex flex-col items-center gap-0.5 p-3 rounded-xl border border-border hover:border-primary hover:text-primary transition-all" title="Save">
              <Bookmark className="h-4 w-4" />
              <span className="text-xs">{flow.save_count}</span>
            </button>
          </form>

          {/* Fork */}
          <Link
            href={`/api/flows/${flow.id}?fork=1`}
            className="flex flex-col items-center gap-0.5 p-3 rounded-xl border border-border hover:border-primary hover:text-primary transition-all"
            title="Fork this flow"
          >
            <GitFork className="h-4 w-4" />
            <span className="text-xs">{flow.fork_count}</span>
          </Link>
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
        {flow.estimated_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatMinutes(flow.estimated_minutes)} to build
          </span>
        )}
        <span>Posted {timeAgo(flow.created_at)}</span>
        {flow.author_name && <span>by <strong className="text-foreground">{flow.author_name}</strong></span>}
        {flow.source_url && (
          <a href={flow.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary">
            <ExternalLink className="h-3.5 w-3.5" /> Source
          </a>
        )}
      </div>

      {/* Tools */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tools</h2>
        <div className="flex flex-wrap gap-2">
          {flow.tools.map(t => (
            <Link key={t} href={`/flows?tool=${encodeURIComponent(t)}`}
              className="text-sm bg-secondary hover:bg-secondary/70 text-secondary-foreground px-3 py-1 rounded-full transition-colors">
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* Why clever */}
      {flow.why_clever && (
        <section className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-2 text-primary">💡 Why this flow is clever</h2>
          <p className="text-sm leading-relaxed">{flow.why_clever}</p>
        </section>
      )}

      {/* Visual diagram */}
      {diagram.nodes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Flow Diagram</h2>
          <FlowDiagram nodes={diagram.nodes} edges={diagram.edges} />
        </section>
      )}

      {/* Steps */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Steps</h2>
        <div className="space-y-3">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-white">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{step.app}</span>
                  {step.action && (
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {step.action}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-6 border-t border-border">
        <Button asChild>
          <Link href="/submit">Fork & Customize</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/flows">Browse More</Link>
        </Button>
      </div>
    </div>
  )
}
