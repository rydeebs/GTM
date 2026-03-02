import Link from 'next/link'
import { ArrowRight, Zap, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { FlowCard } from '@/components/FlowCard'
import type { Flow } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: topFlows } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'published')
    .order('vote_count', { ascending: false })
    .limit(6) as { data: Flow[] | null }

  const { data: recentFlows } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12) as { data: Flow[] | null }

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-20 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
          <Zap className="h-4 w-4" />
          The GTM Automation Flow Library
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-5 max-w-3xl mx-auto leading-tight">
          Discover & share the best <span className="text-primary">GTM automation flows</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Browse hundreds of automation flows built with Zapier, Clay, Make, and more.
          Upvote, save, fork, and get one great flow delivered to your inbox every day.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/flows">Browse Flows <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/submit">Submit Your Flow</Link>
          </Button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16 text-center">
        {[
          { label: 'Flows', value: '500+' },
          { label: 'Tools covered', value: '40+' },
          { label: 'Subscribers', value: '2k+' },
        ].map(stat => (
          <div key={stat.label} className="p-6 rounded-xl border border-border bg-card">
            <div className="text-3xl font-bold text-primary">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Top flows */}
      {topFlows && topFlows.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Top Flows
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/flows?sort=top">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topFlows.map(flow => <FlowCard key={flow.id} flow={flow} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl bg-primary text-primary-foreground p-12 text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Get one great flow, every day</h2>
        <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
          Subscribe to the Flow of the Day digest — a hand-picked automation explained in detail, delivered to your inbox.
        </p>
        <Button asChild variant="secondary" size="lg">
          <Link href="/flow-of-the-day">See Today&apos;s Flow</Link>
        </Button>
      </section>

      {/* Flow showcase */}
      {recentFlows && recentFlows.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-muted-foreground">Recently added flows</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/flows">Browse all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-none">
            {recentFlows.map(flow => (
              <Link
                key={flow.id}
                href={`/flows/${flow.id}`}
                className="flex-shrink-0 w-56 snap-start border border-border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-3">
                  {flow.category}
                </span>
                <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-3">
                  {flow.title}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {flow.tools.slice(0, 3).map(tool => (
                    <span key={tool} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {tool}
                    </span>
                  ))}
                  {flow.tools.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{flow.tools.length - 3}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
