export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const parsed = Schema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('subscribers')
    .upsert({ email: parsed.data.email, active: true }, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
