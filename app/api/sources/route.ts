export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/sources — list all scrape sources
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scrape_sources')
    .select('*')
    .order('platform', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/sources — add a new scrape source
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.platform || !body?.handle) {
    return NextResponse.json({ error: 'platform and handle are required' }, { status: 400 })
  }

  const validPlatforms = ['twitter', 'linkedin', 'reddit']
  if (!validPlatforms.includes(body.platform)) {
    return NextResponse.json({ error: `platform must be one of: ${validPlatforms.join(', ')}` }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scrape_sources')
    .insert({
      platform: body.platform,
      handle:   body.handle.trim(),
      active:   true,
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation = duplicate
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This source already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
