export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'
import { z } from 'zod'

const FlowSchema = z.object({
  title:              z.string().min(3).max(120),
  description:        z.string().min(10).max(1000),
  tools:              z.array(z.string()).min(1),
  category:           z.string().min(1),
  steps:              z.array(z.object({
    label:       z.string(),
    app:         z.string(),
    action:      z.string(),
    description: z.string(),
  })).min(1),
  estimated_minutes:  z.number().int().positive().optional(),
  why_clever:         z.string().optional(),
  source_url:         z.string().url().optional().or(z.literal('')),
  author_name:        z.string().optional(),
})

// GET /api/flows — list flows with optional filters
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const params   = req.nextUrl.searchParams

  const category = params.get('category')
  const tool     = params.get('tool')
  const sort     = params.get('sort') ?? 'newest'
  const q        = params.get('q')
  const page     = parseInt(params.get('page') ?? '1', 10)
  const limit    = 12

  let query = supabase
    .from('flows')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  if (category) query = query.eq('category', category)
  if (tool)     query = query.contains('tools', [tool])
  if (q)        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  if (sort === 'top')      query = query.order('vote_count', { ascending: false })
  else if (sort === 'trending') {
    // Trending: votes in last 7 days — approximate with high vote_count + recency
    query = query
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/flows — submit a new flow
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body     = await req.json()

  const parsed = FlowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const input = parsed.data

  // Auto-generate diagram if not provided
  const diagram_data = stepsTodiagram(input.steps)

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('flows')
    .insert({
      ...input,
      diagram_data,
      author_id:   user?.id ?? null,
      author_name: input.author_name || user?.email?.split('@')[0] || 'Anonymous',
      status:      'published',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
