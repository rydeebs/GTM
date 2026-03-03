export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWeeklyDigestEmail } from '@/lib/email'
import type { Flow } from '@/lib/types'

// Vercel Cron sends GET; delegate to POST handler which validates auth
export async function GET(req: NextRequest) { return POST(req) }

/**
 * POST /api/digest/weekly
 * Sends "Top flows this week" email to all active subscribers.
 * Auth: CRON_SECRET or ADMIN_SECRET_KEY (for manual test sends).
 *
 * Vercel Cron: every Monday at 9 AM UTC ("0 9 * * 1")
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')

  const cronOk  = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const adminOk = adminKey   === process.env.ADMIN_SECRET_KEY

  if (!cronOk && !adminOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Flows published in the last 7 days, sorted by votes
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: flows } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'published')
    .gte('created_at', since)
    .order('vote_count', { ascending: false })
    .limit(7) as { data: Flow[] | null }

  if (!flows?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No new flows this week' })
  }

  // Build week label, e.g. "March 3–9, 2026"
  const weekStart = new Date(since)
  const weekEnd   = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const weekLabel = `${fmt(weekStart)}–${fmt(weekEnd)}, ${weekEnd.getFullYear()}`

  // Get active subscribers
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('email')
    .eq('active', true)

  if (!subscribers?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No subscribers' })
  }

  const BATCH = 10
  let sent    = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH)
    await Promise.all(batch.map(async (sub: { email: string }) => {
      const ok = await sendWeeklyDigestEmail(sub.email, flows, weekLabel)
      if (ok) sent++
    }))
  }

  return NextResponse.json({ ok: true, sent, total: subscribers.length, flows: flows.length })
}
