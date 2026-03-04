/**
 * lib/dedup.ts — Near-duplicate detection for flows.
 *
 * Before publishing a flow we check whether a very similar one already exists,
 * to avoid the library filling up with paraphrased versions of the same idea.
 *
 * Two signals combined:
 *  1. Tools Jaccard — set intersection / set union of lowercased tool names
 *  2. Title token overlap — content-word intersection / union (stopwords stripped)
 *
 * A result is flagged as a duplicate when:
 *  weightedScore = 0.65 * toolsJaccard + 0.35 * titleOverlap  >=  THRESHOLD (0.72)
 *
 * Tools carry more weight because titles can be rephrased while the actual
 * workflow (same tools) stays identical.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const THRESHOLD    = 0.72
const LOOKBACK     = 500   // compare against the N most recent published flows

const STOPWORDS = new Set([
  'a','an','the','to','from','with','and','or','in','on','at','for','of',
  'your','that','this','is','are','was','were','how','use','using','via',
  'into','by','be','as','it','its','you','can','all','new','our','my',
])

export interface DupResult {
  isDuplicate: boolean
  matchId?:    string
  matchTitle?: string
  similarity:  number   // 0–1 rounded to 2 dp
}

// ── Similarity helpers ─────────────────────────────────────────────────────

function toolsJaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0
  const sa = new Set(a.map(t => t.toLowerCase().trim()))
  const sb = new Set(b.map(t => t.toLowerCase().trim()))
  let inter = 0
  for (const t of sa) if (sb.has(t)) inter++
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : inter / union
}

function titleTokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .split(/\W+/)
      .filter(t => t.length > 2 && !STOPWORDS.has(t))
  )
}

function titleOverlap(a: string, b: string): number {
  const ta = titleTokens(a)
  const tb = titleTokens(b)
  if (!ta.size && !tb.size) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 0 : inter / union
}

// ── Main export ────────────────────────────────────────────────────────────

export async function checkDuplicate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  title:   string,
  tools:   string[],
): Promise<DupResult> {
  const { data: flows, error } = await supabase
    .from('flows')
    .select('id, title, tools')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(LOOKBACK)

  if (error || !flows?.length) return { isDuplicate: false, similarity: 0 }

  let best = 0
  let bestFlow: { id: string; title: string } | null = null

  for (const flow of flows) {
    const ts  = toolsJaccard(tools, flow.tools ?? [])
    const ttl = titleOverlap(title, flow.title ?? '')
    const score = 0.65 * ts + 0.35 * ttl

    if (score > best) {
      best     = score
      bestFlow = { id: flow.id, title: flow.title }
    }
  }

  const similarity = Math.round(best * 100) / 100

  return {
    isDuplicate: similarity >= THRESHOLD,
    matchId:     bestFlow?.id,
    matchTitle:  bestFlow?.title,
    similarity,
  }
}
