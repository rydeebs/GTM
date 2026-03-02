export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

function ipHash(ip: string): string {
  return createHash('sha256').update(ip + process.env.IP_HASH_SALT!).digest('hex').slice(0, 16)
}

// POST /api/votes — toggle upvote
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { flow_id } = await req.json()

  if (!flow_id) return NextResponse.json({ error: 'flow_id required' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()

  const ip      = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '0.0.0.0'
  const ip_hash = ipHash(ip)

  // Check if already voted
  let existingQuery = supabase.from('votes').select('id').eq('flow_id', flow_id)
  if (user) existingQuery = existingQuery.eq('user_id', user.id)
  else       existingQuery = existingQuery.eq('ip_hash', ip_hash)

  const { data: existing } = await existingQuery.single()

  if (existing) {
    // Remove vote (toggle off)
    await supabase.from('votes').delete().eq('id', existing.id)
    return NextResponse.json({ voted: false })
  }

  // Add vote
  const { error } = await supabase.from('votes').insert({
    flow_id,
    user_id:  user?.id ?? null,
    ip_hash:  user ? null : ip_hash,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ voted: true })
}
