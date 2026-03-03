export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/metrics — pipeline stats for admin dashboard
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Run all queries in parallel
  const [
    ideasAll,
    ideasByPlatform,
    ideasWeekly,
    flowsCounts,
    flowsTop,
    flowsRecent,
    subscriberCounts,
    sourcesCounts,
    sourceStalest,
  ] = await Promise.all([
    // Total ideas by status
    supabase.from('flow_ideas').select('status'),

    // Ideas grouped by platform (raw counts)
    supabase.from('flow_ideas').select('platform'),

    // Ideas per week for the last 8 weeks (created_at)
    supabase
      .from('flow_ideas')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()),

    // Flow counts by status
    supabase.from('flows').select('status'),

    // Top 10 flows by votes
    supabase
      .from('flows')
      .select('id, title, category, vote_count, created_at, source_url')
      .eq('status', 'published')
      .order('vote_count', { ascending: false })
      .limit(10),

    // 10 most recently published flows
    supabase
      .from('flows')
      .select('id, title, category, vote_count, created_at, source_url')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10),

    // Subscriber counts
    supabase.from('subscribers').select('active'),

    // Source counts
    supabase.from('scrape_sources').select('active'),

    // Stalest active source
    supabase
      .from('scrape_sources')
      .select('handle, platform, last_scraped_at')
      .eq('active', true)
      .order('last_scraped_at', { ascending: true, nullsFirst: true })
      .limit(1),
  ])

  // ── Process ideas stats ──
  const ideas = ideasAll.data ?? []
  const ideaStatusCounts = ideas.reduce((acc: Record<string, number>, { status }) => {
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const platformMap = (ideasByPlatform.data ?? []).reduce((acc: Record<string, number>, { platform }) => {
    acc[platform] = (acc[platform] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const byPlatform = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)

  // Weekly buckets (ISO week starting Monday)
  const weekBuckets: Record<string, number> = {}
  const now = Date.now()
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now - w * 7 * 24 * 60 * 60 * 1000)
    // Round to Monday of that week
    const day = weekStart.getDay()
    const monday = new Date(weekStart)
    monday.setDate(weekStart.getDate() - ((day + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const key = monday.toISOString().slice(0, 10)
    if (!weekBuckets[key]) weekBuckets[key] = 0
  }
  for (const { created_at } of (ideasWeekly.data ?? [])) {
    const d    = new Date(created_at)
    const day  = d.getDay()
    const mon  = new Date(d)
    mon.setDate(d.getDate() - ((day + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    const key = mon.toISOString().slice(0, 10)
    if (key in weekBuckets) weekBuckets[key]++
  }
  const weeklyVolume = Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))

  // ── Process flows stats ──
  const flows = flowsCounts.data ?? []
  const flowStatusCounts = flows.reduce<Record<string, number>>((acc, { status }) => {
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})

  // ── Process subscriber stats ──
  const subs      = subscriberCounts.data ?? []
  const activeSubs = subs.filter(s => s.active).length

  // ── Process sources stats ──
  const sources      = sourcesCounts.data ?? []
  const activeSources = sources.filter(s => s.active).length

  return NextResponse.json({
    data: {
      ideas: {
        total:    ideas.length,
        pending:  ideaStatusCounts.pending  ?? 0,
        approved: ideaStatusCounts.approved ?? 0,
        rejected: ideaStatusCounts.rejected ?? 0,
        byPlatform,
        weeklyVolume,
      },
      flows: {
        total:             flows.length,
        published:         flowStatusCounts.published ?? 0,
        pending:           flowStatusCounts.pending   ?? 0,
        topByVotes:        flowsTop.data ?? [],
        recentlyPublished: flowsRecent.data ?? [],
      },
      subscribers: {
        total:  subs.length,
        active: activeSubs,
      },
      sources: {
        total:   sources.length,
        active:  activeSources,
        stalest: sourceStalest.data?.[0] ?? null,
      },
    },
  })
}
