export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/ideas — save a scraped/extracted idea to the queue
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.raw_content || !body?.source_url || !body?.platform) {
    return NextResponse.json({ error: 'raw_content, source_url, and platform are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('flow_ideas')
    .insert({
      platform:                body.platform,
      source_url:              body.source_url,
      raw_content:             body.raw_content,
      extracted_title:         body.extracted?.title         ?? null,
      extracted_desc:          body.extracted?.description   ?? null,
      extracted_tools:         body.extracted?.tools         ?? [],
      extracted_steps:         body.extracted?.steps         ?? [],
      extracted_category:      body.extracted?.category      ?? null,
      extracted_why_clever:    body.extracted?.why_clever    ?? null,
      extracted_estimated_min: body.extracted?.estimated_minutes ?? null,
      is_gtm_flow:             body.extracted?.is_gtm_flow   ?? true,
      confidence:              body.extracted?.confidence     ?? 0,
      status:                  'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

// GET /api/ideas — list pending flow ideas (admin)
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const status   = req.nextUrl.searchParams.get('status') ?? 'pending'
  const page     = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10)
  const limit    = 20

  const { data, count, error } = await supabase
    .from('flow_ideas')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('confidence', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}
