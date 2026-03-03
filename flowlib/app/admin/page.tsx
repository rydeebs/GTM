'use client'

import { useState } from 'react'
import { Check, X, ExternalLink, RefreshCw, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'
import { timeAgo, CATEGORIES } from '@/lib/utils'
import type { FlowIdea } from '@/lib/types'

// ── Approve/edit modal ─────────────────────────────────────────────────────

interface ApproveModalProps {
  idea:       FlowIdea
  adminKey:   string
  onPublished: (id: string, flowId: string) => void
  onClose:    () => void
}

function ApproveModal({ idea, adminKey, onPublished, onClose }: ApproveModalProps) {
  const [title,  setTitle]  = useState(idea.extracted_title         ?? '')
  const [desc,   setDesc]   = useState(idea.extracted_desc          ?? '')
  const [cat,    setCat]    = useState(idea.extracted_category      ?? 'Other')
  const [why,    setWhy]    = useState(idea.extracted_why_clever    ?? '')
  const [saving, setSaving] = useState(false)
  const [dupErr, setDupErr] = useState<{ matchTitle: string; similarity: number } | null>(null)

  async function publish(force = false) {
    setSaving(true)
    setDupErr(null)
    try {
      const url = `/api/ideas/${idea.id}/publish${force ? '?force=true' : ''}`
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({ title, description: desc, category: cat, why_clever: why }),
      })
      const json = await res.json()

      if (res.status === 409 && json.matchTitle) {
        setDupErr({ matchTitle: json.matchTitle, similarity: json.similarity })
        return
      }
      if (!res.ok) {
        toast({ title: json.error ?? 'Publish failed', variant: 'destructive' })
        return
      }
      toast({ title: 'Published!' })
      onPublished(idea.id, json.data.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Approve &amp; Publish</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>

        {/* Platform + confidence badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="capitalize text-xs">{idea.platform}</Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round((idea.confidence ?? 0) * 100)}% confidence
          </span>
          {idea.extracted_tools.length > 0 && (
            <span className="text-xs text-muted-foreground">{idea.extracted_tools.join(' · ')}</span>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ap-title" className="text-sm">Title</Label>
            <Input id="ap-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-desc" className="text-sm">Description</Label>
            <Textarea id="ap-desc" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-why" className="text-sm">Why clever</Label>
              <Input id="ap-why" placeholder="Key insight (optional)" value={why} onChange={e => setWhy(e.target.value)} />
            </div>
          </div>

          {/* Source preview */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Raw content</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono bg-background p-3 rounded-lg max-h-32 overflow-auto border border-border">
              {idea.raw_content}
            </pre>
          </details>

          {/* Duplicate warning */}
          {dupErr && (
            <div className="border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
              <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Near-duplicate detected</p>
              <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                &ldquo;{dupErr.matchTitle}&rdquo; — {Math.round(dupErr.similarity * 100)}% similar
              </p>
              <Button size="sm" variant="outline" onClick={() => publish(true)} disabled={saving}>
                Publish anyway
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => publish()} disabled={saving || !title || !desc} className="flex-1">
            {saving ? 'Publishing…' : 'Publish'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [ideas,    setIdeas]    = useState<FlowIdea[]>([])
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState<'pending' | 'approved' | 'rejected'>('pending')

  // Approve modal state
  const [approving, setApproving] = useState<FlowIdea | null>(null)

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

  async function reject(id: string) {
    await fetch(`/api/ideas/${id}/reject`, { method: 'POST', headers: { 'x-admin-key': adminKey } })
    toast({ title: 'Rejected' })
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  async function triggerScrape() {
    toast({ title: 'Scraper running…' })
    const res  = await fetch('/api/scrape', {
      method:  'POST',
      headers: { 'x-admin-key': adminKey },
    })
    const json = await res.json()
    if (!res.ok) {
      toast({ title: json.error ?? 'Scrape failed', variant: 'destructive' })
      return
    }
    toast({
      title: `Scrape complete`,
      description: `${json.processed ?? 0} ideas found · ${json.published ?? 0} auto-published · ${json.skipped ?? 0} duplicates skipped`,
    })
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

  function onPublished(ideaId: string, flowId: string) {
    setApproving(null)
    setIdeas(prev => prev.filter(i => i.id !== ideaId))
    // If viewing approved tab and flow was published, refresh
    if (tab === 'approved') fetchIdeas('approved')
    void flowId
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
          onKeyDown={e => e.key === 'Enter' && fetchIdeas()}
        />
        <Button onClick={() => fetchIdeas()} className="w-full">Enter</Button>
      </div>
    )
  }

  return (
    <div>
      {/* Approve / edit modal */}
      {approving && (
        <ApproveModal
          idea={approving}
          adminKey={adminKey}
          onPublished={onPublished}
          onClose={() => setApproving(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Flow Ideas Review</h1>
        <div className="flex gap-2">
          <a href="/admin/metrics">
            <Button variant="outline" size="sm">Metrics</Button>
          </a>
          <a href="/admin/sources">
            <Button variant="outline" size="sm">Sources</Button>
          </a>
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="capitalize text-xs">{idea.platform}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round((idea.confidence ?? 0) * 100)}% confidence
                    </span>
                    {idea.extracted_category && (
                      <Badge variant="secondary" className="text-xs">{idea.extracted_category}</Badge>
                    )}
                    {idea.published_flow_id && (
                      <a href={`/flows/${idea.published_flow_id}`} target="_blank" rel="noopener noreferrer">
                        <Badge className="text-xs bg-green-500/15 text-green-700 dark:text-green-400 border-green-400/30">
                          Published ↗
                        </Badge>
                      </a>
                    )}
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
                    {/* Approve opens the edit modal */}
                    <Button size="sm" onClick={() => setApproving(idea)} className="gap-1">
                      <Edit2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(idea.id)} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}

                {tab === 'approved' && idea.published_flow_id && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setFeatured(idea.published_flow_id!)} className="text-xs">
                      ⭐ Feature
                    </Button>
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
