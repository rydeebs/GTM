/**
 * Scraper module
 * Fetches recent posts from Twitter/X, Reddit, and LinkedIn
 * then hands raw text to Claude for flow extraction.
 *
 * Twitter/X: Uses the Twitter API v2 (bearer token required)
 * Reddit:    Uses the public Reddit JSON API (no auth needed for public subreddits)
 * LinkedIn:  Placeholder — LinkedIn API requires OAuth and partner access;
 *            swap in your preferred scraping approach here.
 */

export interface RawPost {
  platform:   'twitter' | 'reddit' | 'linkedin'
  source_url: string
  content:    string
  author:     string
  created_at: string
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

export async function fetchTwitterPosts(handle: string): Promise<RawPost[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  if (!bearerToken) {
    console.warn('TWITTER_BEARER_TOKEN not set — skipping Twitter scrape')
    return []
  }

  // Strip leading @ if present
  const username = handle.replace(/^@/, '')

  try {
    // 1. Resolve username → user id
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=id`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!userRes.ok) return []
    const userData = await userRes.json()
    const userId   = userData.data?.id
    if (!userId) return []

    // 2. Fetch recent tweets
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,text`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!tweetsRes.ok) return []
    const tweetsData = await tweetsRes.json()

    return (tweetsData.data ?? []).map((tweet: { id: string; text: string; created_at: string }) => ({
      platform:   'twitter',
      source_url: `https://twitter.com/${username}/status/${tweet.id}`,
      content:    tweet.text,
      author:     handle,
      created_at: tweet.created_at,
    })) as RawPost[]
  } catch (err) {
    console.error(`Twitter scrape error for ${handle}:`, err)
    return []
  }
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

export async function fetchRedditPosts(subreddit: string): Promise<RawPost[]> {
  // Strip leading r/ if present
  const sub = subreddit.replace(/^r\//, '')

  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/new.json?limit=25`,
      { headers: { 'User-Agent': 'rungtm-bot/1.0' } }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.data?.children ?? []).map((child: {
      data: { id: string; title: string; selftext: string; permalink: string; author: string; created_utc: number }
    }) => {
      const post = child.data
      return {
        platform:   'reddit',
        source_url: `https://reddit.com${post.permalink}`,
        content:    `${post.title}\n\n${post.selftext}`.slice(0, 2000),
        author:     post.author,
        created_at: new Date(post.created_utc * 1000).toISOString(),
      } as RawPost
    })
  } catch (err) {
    console.error(`Reddit scrape error for ${subreddit}:`, err)
    return []
  }
}

// ─── LinkedIn (placeholder) ───────────────────────────────────────────────────

export async function fetchLinkedInPosts(_handle: string): Promise<RawPost[]> {
  // LinkedIn requires OAuth + partner API access.
  // Implement with your preferred approach (official API, RapidAPI wrapper, etc.)
  console.warn('LinkedIn scraping not yet implemented — skipping')
  return []
}

// ─── Router ──────────────────────────────────────────────────────────────────

export async function fetchPostsForSource(
  platform: 'twitter' | 'linkedin' | 'reddit',
  handle:   string
): Promise<RawPost[]> {
  switch (platform) {
    case 'twitter':  return fetchTwitterPosts(handle)
    case 'reddit':   return fetchRedditPosts(handle)
    case 'linkedin': return fetchLinkedInPosts(handle)
    default:         return []
  }
}
