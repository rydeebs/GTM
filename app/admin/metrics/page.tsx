'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, Zap, Users, Clock, TrendingUp, ThumbsUp, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/utils'

interface PipelineMetrics {
  ideas: {
    total:    number
    pending:  number
    approved: number
    rejected: number
    byPlatform: { platform: string; count: number }[]
    weeklyVolume: { week: string; count: number }[]
  }
  flows: {
    total:     number
    published: number
    pending:   number
    topByVotes: TopFlow[]
    recentlyPublished: TopFlow[]
  }
  subscribers: {
    total:  number
    active: number
  }
  sources: {
    total:  number
    active: number
    stalest: { handle: string; platform: string; last_scraped_at: string | null } | null
  }
}

interface TopFlow {
  id:         string
  title:      string
  category:   string
  vote_count: number
  created_at: string
  source_url: string | null
}

export default function AdminMetricsPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [metrics,  setMetrics]  = useState<PipelineMetrics | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'x-admin-key': adminKey },
      })
      if (res.status === 401) { setError('Wrong admin key'); return }
      if (!res.ok) { setError('Failed to load metrics'); return }
      const json = await res.json()
      setMetrics(json.data)
      setAuthed(true)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  // Auto-refresh every 60s when authed
  useEffect(() => {
    if (!authed) return
    const interval = setInterval(fetchMetrics, 60_000)
    return () => clearInterval(interval)
  }, [authed, fetchMetrics])

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Admin Metrics</h1>
        <Input
          type="password"
          placeholder="Admin secret key"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMetrics()}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={fetchMetrics} className="w-full" disabled={loading}>
          {loading ? 'Loading…' : 'Enter'}
        </Button>
      </div>
    )
  }

  if (!metrics) return <div className="py-20 text-center text-muted-foreground">Loading…</div>

  const ideaApprovalRate = metrics.ideas.total
    ? Math.round((metrics.ideas.approved / metrics.ideas.total) * 100)
    : 0

  const maxWeeklyVol = Math.max(...metrics.ideas.weeklyVolume.map(w => w.count), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Pipeline Metrics</h1>
        <div className="flex gap-2">
          <a href="/admin"><Button variant="outline" size="sm">← Review Queue</Button></a>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Ideas processed"
          value={metrics.ideas.total}
          sub={`${metrics.ideas.pending} pending review`}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Flows published"
          value={metrics.flows.published}
          sub={`${metrics.flows.pending} pending`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Subscribers"
          value={metrics.subscribers.active}
          sub={`${metrics.subscribers.total} total`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Approval rate"
          value={`${ideaApprovalRate}%`}
          sub={`${metrics.ideas.approved} approved · ${metrics.ideas.rejected} rejected`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── Ideas by platform ── */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Ideas by Platform
          </h2>
          <div className="space-y-3">
            {metrics.ideas.byPlatform.map(({ platform, count }) => {
              const pct = metrics.ideas.total ? Math.round((count / metrics.ideas.total) * 100) : 0
              return (
                <div key={platform}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{platform}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Weekly volume chart ── */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Ideas / Week (last 8 weeks)
          </h2>
          <div className="flex items-end gap-2 h-32">
            {metrics.ideas.weeklyVolume.map(({ week, count }) => (
              <div key={week} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{count}</span>
                <div
                  className="w-full bg-primary/80 rounded-t transition-all"
                  style={{ height: `${Math.max(4, (count / maxWeeklyVol) * 100)}%` }}
                  title={`Week of ${week}: ${count} ideas`}
                />
                <span className="text-[10px] text-muted-foreground rotate-45 origin-left mt-1 whitespace-nowrap">
                  {week.slice(5)} {/* MM-DD */}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Top flows by votes ── */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Top Flows by Votes
          </h2>
          <div className="space-y-2">
            {metrics.flows.topByVotes.length === 0 && (
              <p className="text-sm text-muted-foreground">No flows yet</p>
            )}
            {metrics.flows.topByVotes.map((flow, i) => (
              <div key={flow.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground font-mono w-5 text-right shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{flow.title}</div>
                  <div className="text-xs text-muted-foreground">{flow.category}</div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <ThumbsUp className="h-3 w-3" />
                  <span className="text-xs font-mono">{flow.vote_count}</span>
                </div>
                <a href={`/flows/${flow.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recently published ── */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Recently Published
          </h2>
          <div className="space-y-2">
            {metrics.flows.recentlyPublished.length === 0 && (
              <p className="text-sm text-muted-foreground">No flows yet</p>
            )}
            {metrics.flows.recentlyPublished.map(flow => (
              <div key={flow.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{flow.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] py-0">{flow.category}</Badge>
                    <Clock className="h-3 w-3" />
                    {timeAgo(flow.created_at)}
                  </div>
                </div>
                <a href={`/flows/${flow.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrape sources health ── */}
      <div className="border border-border rounded-xl p-5 bg-card mt-6">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Source Health
        </h2>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold">{metrics.sources.active}</span>
            <span className="text-muted-foreground ml-1.5">active sources</span>
          </div>
          <div>
            <span className="text-2xl font-bold">{metrics.sources.total - metrics.sources.active}</span>
            <span className="text-muted-foreground ml-1.5">paused</span>
          </div>
          {metrics.sources.stalest && (
            <div className="text-muted-foreground">
              Stalest: <span className="font-medium text-foreground">{metrics.sources.stalest.handle}</span>
              {metrics.sources.stalest.last_scraped_at
                ? ` — last scraped ${timeAgo(metrics.sources.stalest.last_scraped_at)}`
                : ' — never scraped'}
            </div>
          )}
        </div>
        <div className="mt-3">
          <a href="/admin/sources" className="text-xs text-primary hover:underline">Manage sources →</a>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub,
}: {
  icon:  React.ReactNode
  label: string
  value: string | number
  sub:   string
}) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide mb-2">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  )
}
