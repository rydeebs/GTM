/**
 * Scraper module
 * Fetches recent posts from Twitter/X, Reddit, and LinkedIn
 * then hands raw text to Claude for flow extraction.
 *
 * Twitter/X: Uses the Twitter API v2 (bearer token required)
 *            Fetches user timelines + keyword searches
 *            Reconstructs threads for richer Claude context
 * Reddit:    Uses the public Reddit JSON API (no auth needed for public subreddits)
 *            Fetches post text + top comments for full context
 * LinkedIn:  Uses RapidAPI LinkedIn scraper (RAPIDAPI_KEY required)
 *            Fetches recent posts by profile vanity name or URL
 */

export interface RawPost {
  platform:   'twitter' | 'reddit' | 'linkedin'
  source_url: string
  content:    string  // full text handed to Claude (may include thread/comments)
  author:     string
  created_at: string
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

interface TwitterTweet {
  id:                    string
  text:                  string
  created_at:            string
  conversation_id?:      string
  in_reply_to_user_id?:  string
  referenced_tweets?:    { type: string; id: string }[]
}

/** Fetch timeline tweets for a single @handle, stitching threads together */
export async function fetchTwitterPosts(handle: string): Promise<RawPost[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  if (!bearerToken) {
    console.warn('TWITTER_BEARER_TOKEN not set — skipping Twitter scrape')
    return []
  }

  const username = handle.replace(/^@/, '')

  try {
    // 1. Resolve username → user id
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=id`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!userRes.ok) {
      console.error(`Twitter user lookup failed for ${username}: ${userRes.status}`)
      return []
    }
    const userData = await userRes.json()
    const userId   = userData.data?.id
    if (!userId) return []

    // 2. Fetch recent tweets (exclude retweets, include thread self-replies)
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets` +
      `?max_results=20` +
      `&exclude=retweets` +
      `&tweet.fields=created_at,text,conversation_id,referenced_tweets,in_reply_to_user_id` +
      `&expansions=referenced_tweets.id`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!tweetsRes.ok) {
      console.error(`Twitter timeline fetch failed for ${username}: ${tweetsRes.status}`)
      return []
    }
    const tweetsData = await tweetsRes.json()
    const tweets: TwitterTweet[] = tweetsData.data ?? []

    // Build a map of referenced (quoted) tweet text for context
    const referencedMap: Record<string, string> = {}
    for (const ref of (tweetsData.includes?.tweets ?? [])) {
      referencedMap[ref.id] = ref.text
    }

    // Group tweets by conversation_id to stitch threads
    const conversations: Record<string, TwitterTweet[]> = {}
    for (const tweet of tweets) {
      const cid = tweet.conversation_id ?? tweet.id
      if (!conversations[cid]) conversations[cid] = []
      conversations[cid].push(tweet)
    }

    const posts: RawPost[] = []

    for (const [conversationId, thread] of Object.entries(conversations)) {
      const sorted = thread.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const root = sorted[0]

      // Skip replies to other users (not thread roots)
      if (root.in_reply_to_user_id && root.in_reply_to_user_id !== userId) continue

      // Build full thread text
      let content = sorted.map(t => t.text).join('\n\n')

      // Append quoted tweet context
      for (const tweet of sorted) {
        for (const ref of (tweet.referenced_tweets ?? [])) {
          if (ref.type === 'quoted' && referencedMap[ref.id]) {
            content += `\n\n[Quoted tweet]: ${referencedMap[ref.id]}`
          }
        }
      }

      posts.push({
        platform:   'twitter',
        source_url: `https://twitter.com/${username}/status/${conversationId}`,
        content:    content.slice(0, 3000),
        author:     `@${username}`,
        created_at: root.created_at,
      })
    }

    return posts
  } catch (err) {
    console.error(`Twitter scrape error for ${handle}:`, err)
    return []
  }
}

/** Search Twitter for posts matching a keyword/phrase */
export async function searchTwitterPosts(query: string): Promise<RawPost[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  if (!bearerToken) return []

  try {
    const fullQuery = `${query} -is:retweet lang:en`
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent` +
      `?query=${encodeURIComponent(fullQuery)}` +
      `&max_results=20` +
      `&tweet.fields=created_at,text,author_id` +
      `&expansions=author_id` +
      `&user.fields=username`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!res.ok) {
      console.error(`Twitter search failed for "${query}": ${res.status}`)
      return []
    }
    const data = await res.json()
    const tweets: { id: string; text: string; created_at: string; author_id: string }[] = data.data ?? []

    const authorMap: Record<string, string> = {}
    for (const user of (data.includes?.users ?? [])) {
      authorMap[user.id] = user.username
    }

    return tweets.map(tweet => ({
      platform:   'twitter' as const,
      source_url: `https://twitter.com/i/web/status/${tweet.id}`,
      content:    tweet.text,
      author:     authorMap[tweet.author_id] ? `@${authorMap[tweet.author_id]}` : tweet.author_id,
      created_at: tweet.created_at,
    }))
  } catch (err) {
    console.error(`Twitter search error for "${query}":`, err)
    return []
  }
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

interface RedditPostData {
  id:          string
  title:       string
  selftext:    string
  permalink:   string
  author:      string
  created_utc: number
  num_comments: number
  url?:        string
}

interface RedditCommentChild {
  kind: string
  data: { body: string }
}

/** Fetch recent posts from a subreddit, including top comments for context */
export async function fetchRedditPosts(subreddit: string): Promise<RawPost[]> {
  const sub = subreddit.replace(/^r\//, '')

  try {
    // Fetch both new and hot to maximise signal
    const [newData, hotData] = await Promise.all([
      fetch(`https://www.reddit.com/r/${sub}/new.json?limit=15`, {
        headers: { 'User-Agent': 'rungtm-bot/1.0' },
      }).then(r => r.ok ? r.json() : { data: { children: [] } }),
      fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
        headers: { 'User-Agent': 'rungtm-bot/1.0' },
      }).then(r => r.ok ? r.json() : { data: { children: [] } }),
    ])

    const allChildren: { data: RedditPostData }[] = [
      ...(newData.data?.children ?? []),
      ...(hotData.data?.children ?? []),
    ]

    // Deduplicate by post id
    const seen = new Set<string>()
    const unique = allChildren.filter(c => {
      if (seen.has(c.data.id)) return false
      seen.add(c.data.id)
      return true
    })

    const posts: RawPost[] = await Promise.all(
      unique.map(async (child) => {
        const post = child.data
        const body = (post.selftext ?? '').trim()

        // Skip deleted/removed posts
        if (body === '[deleted]' || body === '[removed]') {
          return null as unknown as RawPost
        }

        let content = body
          ? `${post.title}\n\n${body}`.slice(0, 2000)
          : post.title

        // Fetch top comments for posts with engagement
        if (post.num_comments > 2) {
          try {
            const commentsRes = await fetch(
              `https://www.reddit.com/r/${sub}/comments/${post.id}.json?limit=5&sort=top`,
              { headers: { 'User-Agent': 'rungtm-bot/1.0' } }
            )
            if (commentsRes.ok) {
              const commentsData = await commentsRes.json()
              const comments: string[] = (commentsData[1]?.data?.children ?? [])
                .filter((c: RedditCommentChild) =>
                  c.kind === 't1' && c.data.body && c.data.body !== '[deleted]' && c.data.body !== '[removed]'
                )
                .slice(0, 5)
                .map((c: RedditCommentChild) => c.data.body)

              if (comments.length) {
                content += `\n\n[Top comments]:\n${comments.join('\n---\n')}`
              }
            }
          } catch {
            // Comments are optional context — don't block post processing
          }
        }

        return {
          platform:   'reddit' as const,
          source_url: `https://reddit.com${post.permalink}`,
          content:    content.slice(0, 3000),
          author:     post.author,
          created_at: new Date(post.created_utc * 1000).toISOString(),
        }
      })
    )

    return posts.filter(Boolean)
  } catch (err) {
    console.error(`Reddit scrape error for r/${subreddit}:`, err)
    return []
  }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
// Uses the RapidAPI "LinkedIn Data Scraper" endpoint.
// Set RAPIDAPI_KEY in your environment to enable.
// Handle: LinkedIn vanity name (e.g. "satya-nadella") or full profile URL.

interface LinkedInUpdate {
  commentary?:  string
  url?:         string
  postedAt?:    string | number
  article?: {
    title?:       string
    description?: string
  }
}

export async function fetchLinkedInPosts(handle: string): Promise<RawPost[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set — skipping LinkedIn scrape')
    return []
  }

  // Normalise to vanity name
  const profileId = handle
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
    .replace(/\/+$/, '')
    .trim()

  try {
    const res = await fetch(
      `https://linkedin-data-scraper.p.rapidapi.com/profile_updates` +
      `?profile_url=${encodeURIComponent(`https://www.linkedin.com/in/${profileId}/`)}` +
      `&page=1`,
      {
        headers: {
          'x-rapidapi-host': 'linkedin-data-scraper.p.rapidapi.com',
          'x-rapidapi-key':  rapidApiKey,
        },
      }
    )

    if (!res.ok) {
      console.error(`LinkedIn fetch failed for ${profileId}: ${res.status}`)
      return []
    }

    const data = await res.json()
    const updates: LinkedInUpdate[] = data?.response?.updates ?? []

    return updates.slice(0, 15).map((update) => {
      const text = [
        update.commentary ?? '',
        ...(update.article?.title
          ? [`[Article]: ${update.article.title}`, update.article.description ?? '']
          : []),
      ].filter(Boolean).join('\n\n').trim()

      const postUrl =
        update.url ??
        `https://www.linkedin.com/in/${profileId}/recent-activity/shares/`

      return {
        platform:   'linkedin' as const,
        source_url: postUrl,
        content:    text.slice(0, 3000),
        author:     profileId,
        created_at: update.postedAt
          ? new Date(update.postedAt).toISOString()
          : new Date().toISOString(),
      }
    }).filter(p => p.content.length > 50) // skip image-only / empty posts
  } catch (err) {
    console.error(`LinkedIn scrape error for ${handle}:`, err)
    return []
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

/**
 * Route to the correct scraper.
 * Handle formats:
 *   Twitter:  "@username"  OR  "search:<query>"  (keyword search)
 *   Reddit:   "r/subreddit"
 *   LinkedIn: vanity name or full profile URL
 */
export async function fetchPostsForSource(
  platform: 'twitter' | 'linkedin' | 'reddit',
  handle:   string
): Promise<RawPost[]> {
  switch (platform) {
    case 'twitter':
      if (handle.startsWith('search:')) {
        return searchTwitterPosts(handle.slice('search:'.length).trim())
      }
      return fetchTwitterPosts(handle)

    case 'reddit':
      return fetchRedditPosts(handle)

    case 'linkedin':
      return fetchLinkedInPosts(handle)

    default:
      return []
  }
}
