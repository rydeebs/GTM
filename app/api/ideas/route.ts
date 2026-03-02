import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
