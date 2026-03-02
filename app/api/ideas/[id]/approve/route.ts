import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stepsTodiagram } from '@/lib/utils'

// POST /api/ideas/:id/approve — approve and publish a flow idea
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

  // Publish as a flow
  const steps        = (idea.extracted_steps as any[]) ?? []
  const diagram_data = stepsTodiagram(steps)

  const { data: flow, error: flowErr } = await supabase
    .from('flows')
    .insert({
      title:       idea.extracted_title ?? 'Untitled Flow',
      description: idea.extracted_desc ?? '',
      tools:       idea.extracted_tools ?? [],
      steps,
      diagram_data,
      category:    'Other',
      source_url:  idea.source_url,
      status:      'published',
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
