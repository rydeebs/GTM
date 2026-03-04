'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/hooks/use-toast'
import { timeAgo } from '@/lib/utils'
import type { ScrapeSource } from '@/lib/types'

const PLATFORM_LABELS: Record<string, string> = {
  twitter:  'X / Twitter',
  linkedin: 'LinkedIn',
  reddit:   'Reddit',
}

const PLATFORM_HANDLE_HINTS: Record<string, string> = {
  twitter:  '@username  or  search:GTM automation',
  linkedin: 'vanity-name  or  https://linkedin.com/in/…',
  reddit:   'r/subreddit',
}

export default function AdminSourcesPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [sources,  setSources]  = useState<ScrapeSource[]>([])
  const [loading,  setLoading]  = useState(false)

  // New source form
  const [platform, setPlatform] = useState<'twitter' | 'linkedin' | 'reddit'>('twitter')
  const [handle,   setHandle]   = useState('')
  const [adding,   setAdding]   = useState(false)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sources', {
        headers: { 'x-admin-key': adminKey },
      })
      if (res.status === 401) {
        toast({ title: 'Wrong admin key', variant: 'destructive' })
        return
      }
      const { data } = await res.json()
      setSources(data ?? [])
      setAuthed(true)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  async function addSource() {
    if (!handle.trim()) {
      toast({ title: 'Enter a handle or URL', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/sources', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({ platform, handle: handle.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: json.error ?? 'Failed to add source', variant: 'destructive' })
        return
      }
      setSources(prev => [json.data, ...prev])
      setHandle('')
      toast({ title: 'Source added!' })
    } finally {
      setAdding(false)
    }
  }

  async function toggleSource(source: ScrapeSource) {
    const res = await fetch(`/api/sources/${source.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body:    JSON.stringify({ active: !source.active }),
    })
    if (res.ok) {
      setSources(prev =>
        prev.map(s => s.id === source.id ? { ...s, active: !s.active } : s)
      )
    }
  }

  async function deleteSource(id: string) {
    if (!confirm('Remove this source?')) return
    const res = await fetch(`/api/sources/${id}`, {
      method:  'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
    if (res.ok) {
      setSources(prev => prev.filter(s => s.id !== id))
      toast({ title: 'Source removed' })
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Admin Sources</h1>
        <Input
          type="password"
          placeholder="Admin secret key"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchSources()}
        />
        <Button onClick={fetchSources} className="w-full">Enter</Button>
      </div>
    )
  }

  // Group by platform
  const grouped = sources.reduce<Record<string, ScrapeSource[]>>((acc, s) => {
    if (!acc[s.platform]) acc[s.platform] = []
    acc[s.platform].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Scrape Sources</h1>
        <div className="flex gap-2">
          <a href="/admin">
            <Button variant="outline" size="sm">← Review Queue</Button>
          </a>
          <Button variant="outline" size="sm" onClick={fetchSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add new source */}
      <div className="border border-border rounded-xl p-5 bg-card mb-8">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
          Add Source
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Platform selector */}
          <div className="flex gap-2">
            {(['twitter', 'linkedin', 'reddit'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  platform === p
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-1">
            <div className="flex-1">
              <Input
                placeholder={PLATFORM_HANDLE_HINTS[platform]}
                value={handle}
                onChange={e => setHandle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSource()}
                className="text-sm"
              />
            </div>
            <Button onClick={addSource} disabled={adding || !handle.trim()} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>

        {/* Keyword search hint */}
        {platform === 'twitter' && (
          <p className="text-xs text-muted-foreground mt-2">
            Tip: prefix with <code className="bg-background px-1 rounded">search:</code> to search by keyword instead of a specific account — e.g. <code className="bg-background px-1 rounded">search:GTM automation workflow</code>
          </p>
        )}
      </div>

      {/* Sources list grouped by platform */}
      {sources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No sources yet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(PLATFORM_LABELS).map(([p, label]) => {
            const items = grouped[p]
            if (!items?.length) return null
            return (
              <div key={p}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {label} <span className="font-normal normal-case">({items.length})</span>
                </h3>
                <div className="space-y-2">
                  {items.map(source => (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                        source.active
                          ? 'border-border bg-card'
                          : 'border-border/50 bg-background opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${source.active ? 'border-primary/40 text-primary' : ''}`}
                        >
                          {source.active ? 'active' : 'paused'}
                        </Badge>
                        <span className="text-sm font-mono truncate">{source.handle}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {source.last_scraped_at && (
                          <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(source.last_scraped_at)}
                          </span>
                        )}
                        <button
                          onClick={() => toggleSource(source)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={source.active ? 'Pause this source' : 'Resume this source'}
                        >
                          {source.active
                            ? <ToggleRight className="h-5 w-5 text-primary" />
                            : <ToggleLeft className="h-5 w-5" />
                          }
                        </button>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
