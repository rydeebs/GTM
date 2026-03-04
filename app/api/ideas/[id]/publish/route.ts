import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'
import { checkDuplicate } from '@/lib/dedup'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ideas/[id]/publish
 * Publish a flow idea as a live flow, with optional field overrides.
 * Accepts any status (pending OR approved) so admins can recover from failed auto-publish.
 * Pass ?force=true to skip duplicate detection.
 *
 * Body (all optional — falls back to extracted values):
 *   { title?, description?, category?, tools?, steps?, why_clever?, estimated_minutes? }
 */
export async function POST(
  req:     NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase  = createServiceClient()
  const id        = params.id
  const force     = req.nextUrl.searchParams.get('force') === 'true'
  const overrides = await req.json().catch(() => ({}))

  const { data: idea, error: fetchErr } = await supabase
    .from('flow_ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  // Block only if already published (has a flow linked) — not just by status,
  // since auto-approved ideas should still be publishable if flow creation failed.
  if (idea.published_flow_id && !force) {
    return NextResponse.json(
      { error: 'This idea already has a published flow', flow_id: idea.published_flow_id },
      { status: 409 }
    )
  }

  const title       = overrides.title             ?? idea.extracted_title         ?? 'Untitled Flow'
  const description = overrides.description       ?? idea.extracted_desc          ?? ''
  const category    = overrides.category          ?? idea.extracted_category      ?? 'Other'
  const tools       = overrides.tools             ?? idea.extracted_tools         ?? []
  const steps       = overrides.steps             ?? idea.extracted_steps         ?? []
  const why_clever  = overrides.why_clever        ?? idea.extracted_why_clever    ?? null
  const estimated   = overrides.estimated_minutes ?? idea.extracted_estimated_min ?? null

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  // Near-duplicate check (skip if ?force=true)
  if (!force) {
    const dup = await checkDuplicate(supabase, title, tools)
    if (dup.isDuplicate) {
      return NextResponse.json(
        {
          error:      'Near-duplicate detected — add ?force=true to publish anyway',
          matchId:    dup.matchId,
          matchTitle: dup.matchTitle,
          similarity: dup.similarity,
        },
        { status: 409 }
      )
    }
  }

  const diagram_data = stepsTodiagram(steps)

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
      estimated_minutes: estimated,
      source_url:        idea.source_url,
      author_name:       'RunGTM',
      status:            'published',
    })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

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
