import Anthropic from '@anthropic-ai/sdk'
import type { FlowStep, Platform } from './types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ── Extraction types ──────────────────────────────────────────────────────────

export interface ExtractedFlow {
  is_gtm_flow:       boolean
  title:             string
  description:       string
  category:          string
  tools:             string[]
  steps:             FlowStep[]
  why_clever:        string
  estimated_minutes: number | null
  confidence:        number   // 0–1
}

// ── Extraction ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Lead Generation', 'Sales Automation', 'Marketing', 'Data Enrichment',
  'Outreach', 'CRM', 'Analytics', 'Notifications', 'Content', 'HR & Ops',
  'Finance', 'Other',
]

const EXTRACTION_SCHEMA = `{
  "is_gtm_flow": true,
  "title": "Short punchy title (max 80 chars)",
  "description": "2-3 sentences: what it does, who it's for, what outcome it creates",
  "category": "Lead Generation",
  "tools": ["Tool A", "Tool B"],
  "steps": [
    {
      "label": "Short step name",
      "app": "App name",
      "action": "What the app does in this step",
      "description": "Detailed explanation of this step"
    }
  ],
  "why_clever": "One sentence on the key insight or time saving hack",
  "estimated_minutes": 45,
  "confidence": 0.92
}`

const SYSTEM_PROMPT = `You are a GTM (Go-To-Market) automation expert who identifies and structures automation workflows from social media content.

A GTM flow MUST have:
- At least 2 tools/apps working together in a sequence
- A clear, measurable outcome (leads generated, emails sent, data enriched, meetings booked, etc.)
- Steps that a GTM practitioner could realistically implement

Category must be one of: ${CATEGORIES.join(', ')}

For steps: be thorough and practical. If the post is vague, use your GTM expertise to fill in the likely implementation steps based on the tools mentioned. Each step should have enough detail for someone to actually build this.

Return ONLY valid JSON — no markdown, no explanation.`

export async function extractFlowFromPost(
  rawContent: string,
  options: { url?: string; platform?: Platform | 'manual' } = {}
): Promise<ExtractedFlow | null> {
  const platformCtx =
    options.platform === 'twitter'  ? 'Source: X/Twitter post or thread.\n' :
    options.platform === 'reddit'   ? 'Source: Reddit post or comment.\n' :
    options.platform === 'linkedin' ? 'Source: LinkedIn post or article.\n' : ''

  try {
    const message = await getClient().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: `${platformCtx}${options.url ? `URL: ${options.url}\n` : ''}
Analyze this content and extract a GTM automation flow if one is described.
Set confidence < 0.4 if this is NOT a concrete implementable workflow.

CONTENT:
${rawContent}

Return JSON matching this schema exactly:
${EXTRACTION_SCHEMA}`,
      }],
    })

    const text = message.content.find(b => b.type === 'text')?.text ?? ''
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
    return JSON.parse(jsonStr) as ExtractedFlow
  } catch (err) {
    console.error('Claude extraction error:', err)
    return null
  }
}

// ── Flow of the Day blurb ─────────────────────────────────────────────────────

export async function generateFlowOfDayBlurb(flow: {
  title:              string
  description:        string
  tools:              string[]
  steps:              Array<{ app: string; action: string }>
  estimated_minutes?: number | null
  why_clever?:        string | null
}): Promise<string> {
  const message = await getClient().messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role:    'user',
      content: `Write a punchy, engaging 3-paragraph "Flow of the Day" feature for this automation flow.
Include: what it does, how each tool is used, what makes it clever, and a call-to-action to try it.
Keep it conversational and exciting — like a founder excited about this automation.

Flow: ${JSON.stringify(flow, null, 2)}`,
    }],
  })

  return message.content.find(b => b.type === 'text')?.text ?? flow.description
}
