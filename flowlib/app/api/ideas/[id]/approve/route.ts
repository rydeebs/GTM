export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'
import { checkDuplicate } from '@/lib/dedup'

/**
 * POST /api/ideas/:id/approve
 * One-click approve: converts the idea to a published flow.
 * For more control (editable fields before publish) use /api/ideas/:id/publish instead.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: idea, error: fetchErr } = await supabase
    .from('flow_ideas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  const title       = idea.extracted_title ?? 'Untitled Flow'
  const description = idea.extracted_desc  ?? ''
  const tools       = idea.extracted_tools ?? []
  const steps       = (idea.extracted_steps as object[]) ?? []
  const category    = idea.extracted_category      ?? 'Other'
  const why_clever  = idea.extracted_why_clever    ?? null
  const estimated   = idea.extracted_estimated_min ?? null

  // Warn (but don't block) if a near-duplicate already exists
  const dup = await checkDuplicate(supabase, title, tools)
  if (dup.isDuplicate) {
    return NextResponse.json(
      {
        error:       'Near-duplicate detected — use /publish with ?force=true to override',
        matchId:     dup.matchId,
        matchTitle:  dup.matchTitle,
        similarity:  dup.similarity,
      },
      { status: 409 }
    )
  }

  const diagram_data = stepsTodiagram(steps as Parameters<typeof stepsTodiagram>[0])

  const { data: flow, error: flowErr } = await supabase
    .from('flows')
    .insert({
      title,
      description,
      tools,
      steps,
      diagram_data,
      category,
      why_clever,
      estimated_minutes: estimated,
      source_url:        idea.source_url,
      status:            'published',
    })
    .select()
    .single()

  if (flowErr) return NextResponse.json({ error: flowErr.message }, { status: 500 })

  await supabase
    .from('flow_ideas')
    .update({ status: 'approved', published_flow_id: flow.id, reviewed_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ data: flow })
}
