import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchPostsForSource } from '@/lib/scraper'
import { extractFlowFromPost } from '@/lib/claude'
import type { ScrapeSource } from '@/lib/types'

const AUTO_PUBLISH_THRESHOLD = 0.85

/**
 * POST /api/scrape
 * Called by Vercel Cron — scrapes all active sources, runs Claude extraction,
 * and saves results as flow_ideas.
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 1. Get active scrape sources
  const { data: sources } = await supabase
    .from('scrape_sources')
    .select('*')
    .eq('active', true) as { data: ScrapeSource[] | null }

  if (!sources?.length) return NextResponse.json({ ok: true, processed: 0 })

  let totalProcessed = 0
  let totalPublished = 0

  for (const source of sources) {
    try {
      // 2. Fetch posts from the platform
      const posts = await fetchPostsForSource(source.platform, source.handle)

      for (const post of posts) {
        // Skip if we've already seen this URL
        const { data: existing } = await supabase
          .from('flow_ideas')
          .select('id')
          .eq('source_url', post.source_url)
          .single()

        if (existing) continue

        // 3. Run Claude extraction
        const extracted = await extractFlowFromPost(post.content)
        if (!extracted) continue

        totalProcessed++

        const ideaPayload = {
          source_id:       source.id,
          platform:        post.platform,
          source_url:      post.source_url,
          raw_content:     post.content,
          extracted_title: extracted.title,
          extracted_desc:  extracted.description,
          extracted_tools: extracted.tools,
          extracted_steps: extracted.steps,
          confidence:      extracted.confidence,
          status:          extracted.confidence >= AUTO_PUBLISH_THRESHOLD ? 'approved' : 'pending',
        }

        const { data: idea } = await supabase
          .from('flow_ideas')
          .insert(ideaPayload)
          .select()
          .single()

        // 4. Auto-publish high-confidence flows
        if (idea && extracted.confidence >= AUTO_PUBLISH_THRESHOLD) {
          const { data: publishedFlow } = await supabase
            .from('flows')
            .insert({
              title:       extracted.title,
              description: extracted.description,
              tools:       extracted.tools,
              steps:       extracted.steps,
              category:    inferCategory(extracted.tools),
              source_url:  post.source_url,
              author_name: post.author,
              why_clever:  extracted.why_clever,
              status:      'published',
            })
            .select()
            .single()

          if (publishedFlow) {
            await supabase
              .from('flow_ideas')
              .update({ published_flow_id: publishedFlow.id })
              .eq('id', idea.id)
            totalPublished++
          }
        }
      }

      // Update last_scraped_at
      await supabase
        .from('scrape_sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', source.id)

    } catch (err) {
      console.error(`Scrape error for source ${source.handle}:`, err)
    }
  }

  return NextResponse.json({ ok: true, processed: totalProcessed, published: totalPublished })
}

function inferCategory(tools: string[]): string {
  const lower = tools.map(t => t.toLowerCase())
  if (lower.some(t => t.includes('apollo') || t.includes('hunter') || t.includes('clay'))) return 'Lead Generation'
  if (lower.some(t => t.includes('hubspot') || t.includes('salesforce') || t.includes('crm'))) return 'CRM'
  if (lower.some(t => t.includes('instantly') || t.includes('lemlist') || t.includes('outreach'))) return 'Outreach'
  if (lower.some(t => t.includes('slack') || t.includes('gmail') || t.includes('email'))) return 'Notifications'
  return 'Other'
}
