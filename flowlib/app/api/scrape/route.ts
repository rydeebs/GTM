export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchPostsForSource } from '@/lib/scraper'
import { extractFlowFromPost } from '@/lib/claude'
import { stepsTodiagram } from '@/lib/utils'
import type { ScrapeSource, Platform } from '@/lib/types'

const AUTO_PUBLISH_THRESHOLD = 0.85

/**
 * POST /api/scrape
 * Called by Vercel Cron or admin trigger — scrapes all active sources,
 * runs Claude extraction, and saves results as flow_ideas.
 *
 * Auth: accepts either CRON_SECRET (for cron) or ADMIN_SECRET_KEY (for manual trigger).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')

  const cronOk  = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const adminOk = adminKey   === process.env.ADMIN_SECRET_KEY

  if (!cronOk && !adminOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 1. Get active scrape sources
  const { data: sources } = await supabase
    .from('scrape_sources')
    .select('*')
    .eq('active', true) as { data: ScrapeSource[] | null }

  if (!sources?.length) return NextResponse.json({ ok: true, processed: 0, published: 0 })

  let totalProcessed = 0
  let totalPublished = 0
  const errors: string[] = []

  for (const source of sources) {
    try {
      // 2. Fetch posts from the platform
      const posts = await fetchPostsForSource(source.platform as Platform, source.handle)

      for (const post of posts) {
        // Skip already-seen URLs (deduplication)
        const { data: existing } = await supabase
          .from('flow_ideas')
          .select('id')
          .eq('source_url', post.source_url)
          .maybeSingle()

        if (existing) continue

        // 3. Run Claude extraction with platform context
        const extracted = await extractFlowFromPost(post.content, {
          url:      post.source_url,
          platform: post.platform,
        })

        // Skip posts Claude determined aren't GTM flows
        if (!extracted || !extracted.is_gtm_flow) continue

        totalProcessed++

        const willAutoPublish = extracted.confidence >= AUTO_PUBLISH_THRESHOLD
        const ideaStatus = willAutoPublish ? 'approved' : 'pending'

        const ideaPayload = {
          source_id:               source.id,
          platform:                post.platform,
          source_url:              post.source_url,
          raw_content:             post.content,
          extracted_title:         extracted.title,
          extracted_desc:          extracted.description,
          extracted_tools:         extracted.tools,
          extracted_steps:         extracted.steps,
          extracted_category:      extracted.category,
          extracted_why_clever:    extracted.why_clever,
          extracted_estimated_min: extracted.estimated_minutes,
          is_gtm_flow:             extracted.is_gtm_flow,
          confidence:              extracted.confidence,
          status:                  ideaStatus,
        }

        const { data: idea } = await supabase
          .from('flow_ideas')
          .insert(ideaPayload)
          .select('id')
          .single()

        // 4. Auto-publish high-confidence flows
        if (idea && willAutoPublish) {
          const diagram_data = stepsTodiagram(extracted.steps)

          const { data: publishedFlow } = await supabase
            .from('flows')
            .insert({
              title:             extracted.title,
              description:       extracted.description,
              tools:             extracted.tools,
              steps:             extracted.steps,
              category:          extracted.category,
              diagram_data,
              source_url:        post.source_url,
              author_name:       post.author,
              why_clever:        extracted.why_clever,
              estimated_minutes: extracted.estimated_minutes,
              status:            'published',
            })
            .select('id')
            .single()

          if (publishedFlow) {
            await supabase
              .from('flow_ideas')
              .update({
                published_flow_id: publishedFlow.id,
                reviewed_at:       new Date().toISOString(),
              })
              .eq('id', idea.id)
            totalPublished++
          }
        }
      }

      // Update last_scraped_at for this source
      await supabase
        .from('scrape_sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', source.id)

    } catch (err) {
      const msg = `Scrape error for ${source.platform}/${source.handle}: ${err}`
      console.error(msg)
      errors.push(msg)
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: totalProcessed,
    published: totalPublished,
    errors:    errors.length ? errors : undefined,
  })
}
