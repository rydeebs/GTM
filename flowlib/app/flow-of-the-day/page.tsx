import { Clock, ArrowUp, ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { generateFlowOfDayBlurb } from '@/lib/claude'
import { FlowDiagram } from '@/components/FlowDiagram'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubscribeForm } from '@/components/SubscribeForm'
import { formatMinutes, stepsTodiagram } from '@/lib/utils'
import type { Flow } from '@/lib/types'

export const revalidate = 3600 // cache for 1 hour

export default async function FlowOfTheDayPage() {
  const supabase = await createClient()
  const today    = new Date().toISOString().split('T')[0]

  // Try explicitly featured flow for today
  let { data: flow } = await supabase
    .from('flows')
    .select('*')
    .eq('is_featured', true)
    .eq('featured_date', today)
    .single() as { data: Flow | null }

  // Fallback: highest-voted flow
  if (!flow) {
    const { data: fallback } = await supabase
      .from('flows')
      .select('*')
      .eq('status', 'published')
      .order('vote_count', { ascending: false })
      .limit(1)
      .single() as { data: Flow | null }
    flow = fallback
  }

  if (!flow) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Star className="h-10 w-10 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No featured flow yet today</p>
        <p className="text-sm mt-2 mb-6">Be the first to submit one!</p>
        <Button asChild><Link href="/submit">Submit a Flow</Link></Button>
      </div>
    )
  }

  // Generate editorial blurb
  let blurb = flow.description
  try {
    blurb = await generateFlowOfDayBlurb({
      title:             flow.title,
      description:       flow.description,
      tools:             flow.tools,
      steps:             flow.steps,
      estimated_minutes: flow.estimated_minutes,
      why_clever:        flow.why_clever,
    })
  } catch {}

  const diagram = flow.diagram_data ?? stepsTodiagram(flow.steps)
  const dateStr  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto">
      {/* Date badge */}
      <div className="flex items-center gap-2 mb-6">
        <Badge className="bg-amber-900/40 text-amber-400 border-amber-700/60 hover:bg-amber-900/40">
          ⭐ Flow of the Day — {dateStr}
        </Badge>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold leading-tight mb-4">{flow.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
        <Badge variant="outline">{flow.category}</Badge>
        {flow.estimated_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatMinutes(flow.estimated_minutes)} to build
          </span>
        )}
        {flow.source_url && (
          <a href={flow.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
            <ExternalLink className="h-4 w-4" /> Original source
          </a>
        )}
        <span className="flex items-center gap-1">
          <ArrowUp className="h-4 w-4" /> {flow.vote_count} votes
        </span>
      </div>

      {/* Editorial blurb */}
      <div className="prose prose-gray max-w-none mb-8">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{blurb}</p>
      </div>

      {/* Tools */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tools used</h2>
        <div className="flex flex-wrap gap-2">
          {flow.tools.map(t => (
            <Link key={t} href={`/flows?tool=${encodeURIComponent(t)}`}
              className="text-sm bg-secondary text-secondary-foreground hover:bg-secondary/70 px-3 py-1 rounded-full transition-colors">
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* Why clever */}
      {flow.why_clever && (
        <section className="mb-8 bg-amber-950/30 border border-amber-800/40 rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-2 text-amber-400">💡 Why it's clever</h2>
          <p className="text-sm leading-relaxed text-amber-200/75">{flow.why_clever}</p>
        </section>
      )}

      {/* Diagram */}
      {diagram.nodes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Flow Diagram</h2>
          <FlowDiagram nodes={diagram.nodes} edges={diagram.edges} />
        </section>
      )}

      {/* Steps */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">How it works — step by step</h2>
        <div className="space-y-3">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-sm mb-0.5">{step.app}</div>
                {step.action && <div className="text-xs text-muted-foreground mb-1">{step.action}</div>}
                {step.description && <div className="text-sm text-muted-foreground">{step.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 mb-12 pt-4 border-t border-border">
        <Button asChild>
          <Link href={`/flows/${flow.id}`}>View Full Flow →</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/submit">Submit Your Own</Link>
        </Button>
      </div>

      {/* Subscribe */}
      <div className="rounded-2xl bg-card border border-white/8 p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Get this in your inbox</h2>
        <p className="text-foreground/45 mb-6 text-sm">One great automation flow every morning. No spam, ever.</p>
        <SubscribeForm />
      </div>
    </div>
  )
}
