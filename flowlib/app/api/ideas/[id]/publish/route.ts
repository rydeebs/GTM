import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST /api/ideas/[id]/publish
// Body: optional overrides — { title?, description?, category?, tools?, why_clever?, estimated_minutes? }
// Creates a published flow from the idea, marks the idea as approved.
export async function POST(
  req:     NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const id       = params.id
  const overrides = await req.json().catch(() => ({}))

  // Fetch the idea
  const { data: idea, error: fetchErr } = await supabase
    .from('flow_ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  if (idea.status !== 'pending') {
    return NextResponse.json({ error: `Idea is already ${idea.status}` }, { status: 409 })
  }

  const title       = overrides.title       ?? idea.extracted_title
  const description = overrides.description ?? idea.extracted_desc
  const category    = overrides.category    ?? 'Other'
  const tools       = overrides.tools       ?? idea.extracted_tools ?? []
  const steps       = overrides.steps       ?? idea.extracted_steps ?? []
  const why_clever  = overrides.why_clever  ?? null
  const estimated_minutes = overrides.estimated_minutes ?? null

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  const diagram_data = stepsTodiagram(steps)

  // Insert the flow
  const { data: flow, error: insertErr } = await supabase
    .from('flows')
    .insert({
      title,
      description,
      category,
      tools,
      steps,
      diagram_data,
      why_clever,
      estimated_minutes,
      source_url:  idea.source_url,
      author_name: 'RunGTM',
      status:      'published',
    })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Mark idea as approved
  await supabase
    .from('flow_ideas')
    .update({
      status:            'approved',
      published_flow_id: flow.id,
      reviewed_at:       new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ data: flow }, { status: 201 })
}
