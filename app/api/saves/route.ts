export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/saves — toggle save
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Login required to save flows' }, { status: 401 })

  const { flow_id } = await req.json()
  if (!flow_id) return NextResponse.json({ error: 'flow_id required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('saves')
    .select('id')
    .eq('flow_id', flow_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('saves').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  }

  const { error } = await supabase.from('saves').insert({ flow_id, user_id: user.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: true })
}
