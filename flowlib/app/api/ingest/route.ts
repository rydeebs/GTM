export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { extractFlowFromPost } from '@/lib/claude'
import type { Platform } from '@/lib/types'

/**
 * POST /api/ingest
 * Public-ish endpoint for programmatic content submission.
 * Protected by INGEST_API_KEY (or ADMIN_SECRET_KEY for admin use).
 *
 * Use cases:
 *   - Browser bookmarklet (select text → POST current URL + selection)
 *   - Zapier / Make.com webhook action
 *   - Browser extension
 *   - CLI script for batch import
 *
 * Body:
 *   content     string   — raw post / article text (required)
 *   source_url  string   — original URL (optional but recommended)
 *   platform    string   — 'twitter' | 'linkedin' | 'reddit' | 'manual' (default: 'manual')
 *   author      string   — attribution label (optional)
 *
 * Returns the Claude-extracted flow data plus the saved idea id.
 * The idea is saved as 'pending' for admin review.
 */
export async function POST(req: NextRequest) {
  // Accept either the ingest key (for external integrations) or admin key
  const ingestKey = req.headers.get('x-api-key') ?? req.headers.get('x-ingest-key')
  const adminKey  = req.headers.get('x-admin-key')

  const ingestOk = ingestKey === process.env.INGEST_API_KEY
  const adminOk  = adminKey  === process.env.ADMIN_SECRET_KEY

  if (!ingestOk && !adminOk) {
    return NextResponse.json({ error: 'Unauthorized — provide x-api-key or x-admin-key' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 })
  }

  const content    = body.content.trim()
  const source_url = (body.source_url ?? '').trim() || 'manual'
  const platform   = (['twitter', 'linkedin', 'reddit'].includes(body.platform)
    ? body.platform
    : 'manual') as Platform | 'manual'
  const author     = (body.author ?? '').trim() || null

  if (content.length < 20) {
    return NextResponse.json({ error: 'Content too short — minimum 20 characters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Deduplicate by source_url (skip 'manual' since those are always unique)
  if (source_url !== 'manual') {
    const { data: existing } = await supabase
      .from('flow_ideas')
      .select('id, status')
      .eq('source_url', source_url)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This URL has already been ingested', idea_id: existing.id, status: existing.status },
        { status: 409 }
      )
    }
  }

  // Run Claude extraction
  const extracted = await extractFlowFromPost(content, {
    url:      source_url !== 'manual' ? source_url : undefined,
    platform: platform !== 'manual' ? platform : undefined,
  })

  if (!extracted) {
    return NextResponse.json({ error: 'Claude extraction failed' }, { status: 500 })
  }

  if (!extracted.is_gtm_flow) {
    return NextResponse.json(
      {
        error:       'Not identified as a GTM flow',
        is_gtm_flow: false,
        confidence:  extracted.confidence,
        title:       extracted.title,
      },
      { status: 422 }
    )
  }

  // Save to flow_ideas as pending
  const { data: idea, error: insertErr } = await supabase
    .from('flow_ideas')
    .insert({
      platform:                platform,
      source_url,
      raw_content:             content,
      extracted_title:         extracted.title,
      extracted_desc:          extracted.description,
      extracted_tools:         extracted.tools,
      extracted_steps:         extracted.steps,
      extracted_category:      extracted.category,
      extracted_why_clever:    extracted.why_clever,
      extracted_estimated_min: extracted.estimated_minutes,
      is_gtm_flow:             extracted.is_gtm_flow,
      confidence:              extracted.confidence,
      status:                  'pending',
    })
    .select('id, status, confidence')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok:         true,
    idea_id:    idea.id,
    status:     idea.status,
    extracted,
  }, { status: 201 })
}
