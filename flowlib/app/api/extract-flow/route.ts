import { NextRequest, NextResponse } from 'next/server'
import { extractFlowFromPost } from '@/lib/claude'
import type { Platform } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/extract-flow
// Body: { content: string, url?: string, platform?: Platform | 'manual' }
// Returns the extracted flow data without writing to the DB.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, url, platform } = body as {
      content:   string
      url?:      string
      platform?: Platform | 'manual'
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const extracted = await extractFlowFromPost(content.trim(), { url, platform })

    if (!extracted) {
      return NextResponse.json(
        { error: 'Extraction failed — Claude returned an unexpected response.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('/api/extract-flow error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
