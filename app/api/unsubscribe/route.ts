export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/unsubscribe — mark a subscriber as inactive
// Body: { email: string }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('subscribers')
    .update({ active: false })
    .eq('email', body.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
