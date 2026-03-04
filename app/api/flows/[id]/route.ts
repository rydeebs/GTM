export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'

// GET /api/flows/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('flows')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data })
}

// POST /api/flows/:id/fork — fork a flow
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const url      = new URL(req.url)

  if (!url.pathname.endsWith('/fork')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: original, error: fetchErr } = await supabase
    .from('flows')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !original) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('flows')
    .insert({
      title:             `Fork of ${original.title}`,
      description:       original.description,
      tools:             original.tools,
      category:          original.category,
      steps:             original.steps,
      diagram_data:      original.diagram_data ?? stepsTodiagram(original.steps),
      estimated_minutes: original.estimated_minutes,
      why_clever:        original.why_clever,
      author_id:         user?.id ?? null,
      author_name:       user?.email?.split('@')[0] ?? 'Anonymous',
      forked_from:       original.id,
      status:            'published',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment fork count on original
  await supabase.rpc('increment', { table_name: 'flows', col: 'fork_count', row_id: original.id })

  return NextResponse.json({ data }, { status: 201 })
}
