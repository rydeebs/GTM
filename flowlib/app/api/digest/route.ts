export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateFlowOfDayBlurb } from '@/lib/claude'
import { sendDigestEmail } from '@/lib/email'
import type { Flow } from '@/lib/types'

/**
 * POST /api/digest
 * Called by Vercel Cron daily — sends the Flow of the Day email to all active subscribers.
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today    = new Date().toISOString().split('T')[0]

  // 1. Get featured flow
  const { data: flow } = await supabase
    .from('flows')
    .select('*')
    .eq('is_featured', true)
    .eq('featured_date', today)
    .single() as { data: Flow | null }

  if (!flow) {
    return NextResponse.json({ error: 'No featured flow for today' }, { status: 404 })
  }

  // 2. Generate blurb with Claude
  const blurb = await generateFlowOfDayBlurb({
    title:             flow.title,
    description:       flow.description,
    tools:             flow.tools,
    steps:             flow.steps,
    estimated_minutes: flow.estimated_minutes,
    why_clever:        flow.why_clever,
  })

  // 3. Get active subscribers
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('email')
    .eq('active', true)

  if (!subscribers?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // 4. Send emails (batched to avoid rate limits)
  const BATCH = 10
  let sent    = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH)
    await Promise.all(batch.map(async (sub: { email: string }) => {
      const ok = await sendDigestEmail(sub.email, flow, blurb)
      if (ok) sent++
    }))
  }

  return NextResponse.json({ ok: true, sent, total: subscribers.length })
}
