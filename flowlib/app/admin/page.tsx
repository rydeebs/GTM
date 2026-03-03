'use client'

import { useState } from 'react'
import { Check, X, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/hooks/use-toast'
import { timeAgo } from '@/lib/utils'
import type { FlowIdea } from '@/lib/types'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [ideas,    setIdeas]    = useState<FlowIdea[]>([])
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState<'pending' | 'approved' | 'rejected'>('pending')

  async function fetchIdeas(status = tab) {
    setLoading(true)
    try {
      const res = await fetch(`/api/ideas?status=${status}`, {
        headers: { 'x-admin-key': adminKey },
      })
      if (res.status === 401) { toast({ title: 'Wrong admin key', variant: 'destructive' }); return }
      const { data } = await res.json()
      setIdeas(data ?? [])
      setAuthed(true)
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: string) {
    await fetch(`/api/ideas/${id}/approve`, { method: 'POST', headers: { 'x-admin-key': adminKey } })
    toast({ title: 'Approved & published!' })
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  async function reject(id: string) {
    await fetch(`/api/ideas/${id}/reject`, { method: 'POST', headers: { 'x-admin-key': adminKey } })
    toast({ title: 'Rejected' })
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  async function triggerScrape() {
    const res = await fetch('/api/scrape', {
      method:  'POST',
      headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? adminKey}` },
    })
    const json = await res.json()
    toast({ title: `Scraped: ${json.processed ?? 0} ideas found, ${json.published ?? 0} auto-published` })
    fetchIdeas()
  }

  async function setFeatured(flowId: string) {
    const res = await fetch('/api/featured', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body:    JSON.stringify({ flow_id: flowId }),
    })
    if (res.ok) toast({ title: 'Set as Flow of the Day!' })
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Input
          type="password"
          placeholder="Admin secret key"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
        />
        <Button onClick={() => fetchIdeas()} className="w-full">Enter</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Flow Ideas Review</h1>
        <div className="flex gap-2">
          <a href="/admin/import">
            <Button variant="outline" size="sm">+ Import Flow</Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => fetchIdeas()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={triggerScrape}>
            Run Scraper Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); fetchIdeas(t) }}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No {tab} ideas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map(idea => (
            <div key={idea.id} className="border border-border rounded-xl p-5 bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize text-xs">{idea.platform}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round((idea.confidence ?? 0) * 100)}% confidence
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(idea.created_at)}</span>
                  </div>

                  <h3 className="font-semibold mb-1">{idea.extracted_title ?? '(no title extracted)'}</h3>
                  {idea.extracted_desc && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{idea.extracted_desc}</p>
                  )}

                  {idea.extracted_tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {idea.extracted_tools.map(t => (
                        <span key={t} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}

                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Raw content</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono bg-background p-3 rounded-lg max-h-40 overflow-auto border border-border">
                      {idea.raw_content}
                    </pre>
                  </details>

                  <a href={idea.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-primary hover:underline mt-2">
                    <ExternalLink className="h-3 w-3" /> {idea.source_url}
                  </a>
                </div>

                {tab === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => approve(idea.id)} className="gap-1">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(idea.id)} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    {idea.published_flow_id && (
                      <Button size="sm" variant="ghost" onClick={() => setFeatured(idea.published_flow_id!)} className="text-xs">
                        ⭐ Feature
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
