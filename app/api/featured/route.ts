export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/featured — get today's featured flow
export async function GET() {
  const supabase = createServiceClient()
  const today    = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('flows')
    .select('*')
    .eq('is_featured', true)
    .eq('featured_date', today)
    .single()

  if (error || !data) {
    // Fallback: highest-voted published flow not yet featured
    const { data: fallback } = await supabase
      .from('flows')
      .select('*')
      .eq('status', 'published')
      .order('vote_count', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ data: fallback ?? null })
  }

  return NextResponse.json({ data })
}

// POST /api/featured — set a flow as today's featured (admin)
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase    = createServiceClient()
  const { flow_id, date } = await req.json()
  const featuredDate = date ?? new Date().toISOString().split('T')[0]

  // Unfeature any existing flow for that date
  await supabase
    .from('flows')
    .update({ is_featured: false, featured_date: null })
    .eq('featured_date', featuredDate)

  const { data, error } = await supabase
    .from('flows')
    .update({ is_featured: true, featured_date: featuredDate })
    .eq('id', flow_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
