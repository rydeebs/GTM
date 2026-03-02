import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/ideas/:id/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  await supabase
    .from('flow_ideas')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
