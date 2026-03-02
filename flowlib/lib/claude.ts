import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedFlow {
  title:       string
  description: string
  tools:       string[]
  steps:       Array<{ label: string; app: string; action: string; description: string }>
  why_clever:  string
  confidence:  number  // 0–1
}

const SYSTEM_PROMPT = `You are an expert at identifying GTM (Go-To-Market) automation flows from social media posts.
Extract structured automation flow data from the provided post text.
Return ONLY valid JSON matching the schema. If the post is not about an automation flow, set confidence below 0.4.`

const SCHEMA = `{
  "title": "short title for the flow",
  "description": "2-3 sentence description of what this flow does and why it's useful",
  "tools": ["list", "of", "tools", "mentioned"],
  "steps": [
    { "label": "Step name", "app": "App name", "action": "What the action does", "description": "More detail" }
  ],
  "why_clever": "One sentence on what makes this automation clever or time-saving",
  "confidence": 0.85
}`

export async function extractFlowFromPost(rawContent: string): Promise<ExtractedFlow | null> {
  try {
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role:    'user',
          content: `Extract a GTM automation flow from this post:\n\n${rawContent}\n\nReturn JSON matching this schema:\n${SCHEMA}`,
        },
      ],
    })

    const text = message.content.find(b => b.type === 'text')?.text ?? ''

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
    const jsonStr   = jsonMatch[1]?.trim() ?? text.trim()

    const parsed = JSON.parse(jsonStr) as ExtractedFlow
    return parsed
  } catch (err) {
    console.error('Claude extraction error:', err)
    return null
  }
}

export async function generateFlowOfDayBlurb(flow: {
  title:              string
  description:        string
  tools:              string[]
  steps:              Array<{ app: string; action: string }>
  estimated_minutes?: number | null
  why_clever?:        string | null
}): Promise<string> {
  const message = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role:    'user',
        content: `Write a punchy, engaging 3-paragraph "Flow of the Day" feature for this automation flow.
Include: what it does, how each tool is used, what makes it clever, and a call-to-action to try it.
Keep it conversational and exciting — like a founder excited about this automation.

Flow: ${JSON.stringify(flow, null, 2)}`,
      },
    ],
  })

  return message.content.find(b => b.type === 'text')?.text ?? flow.description
}
