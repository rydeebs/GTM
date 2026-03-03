'use client'

import { useState } from 'react'
import { Loader2, Wand2, Save, Upload, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/hooks/use-toast'
import type { ExtractedFlow } from '@/lib/claude'
import type { Platform } from '@/lib/types'

const PLATFORMS: { value: Platform | 'manual'; label: string }[] = [
  { value: 'manual',   label: 'Manual / Paste' },
  { value: 'twitter',  label: 'X / Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'reddit',   label: 'Reddit' },
]

export default function AdminImportPage() {
  const [adminKey,   setAdminKey]   = useState('')
  const [authed,     setAuthed]     = useState(false)
  const [url,        setUrl]        = useState('')
  const [content,    setContent]    = useState('')
  const [platform,   setPlatform]   = useState<Platform | 'manual'>('manual')
  const [extracting, setExtracting] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [extracted,  setExtracted]  = useState<ExtractedFlow | null>(null)

  // Editable fields
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('')
  const [whyClever,   setWhyClever]   = useState('')
  const [estMinutes,  setEstMinutes]  = useState('')
  const [tools,       setTools]       = useState('')  // comma-separated

  function applyExtracted(data: ExtractedFlow) {
    setExtracted(data)
    setTitle(data.title ?? '')
    setDescription(data.description ?? '')
    setCategory(data.category ?? '')
    setWhyClever(data.why_clever ?? '')
    setEstMinutes(data.estimated_minutes != null ? String(data.estimated_minutes) : '')
    setTools((data.tools ?? []).join(', '))
  }

  async function handleExtract() {
    if (!content.trim()) {
      toast({ title: 'Paste some content first', variant: 'destructive' })
      return
    }
    setExtracting(true)
    try {
      const res = await fetch('/api/extract-flow', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: content.trim(), url: url || undefined, platform }),
      })
      const json = await res.json()
      if (!res.ok || !json.data) {
        toast({ title: json.error ?? 'Extraction failed', variant: 'destructive' })
        return
      }
      applyExtracted(json.data)
      toast({ title: 'Extraction complete!' })
    } finally {
      setExtracting(false)
    }
  }

  async function handleSaveToQueue() {
    if (!extracted) return
    setSaving(true)
    try {
      const res = await fetch('/api/ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({
          platform,
          source_url:  url || 'manual',
          raw_content: content,
          extracted: {
            ...extracted,
            title:             title,
            description:       description,
            category:          category,
            why_clever:        whyClever,
            estimated_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
            tools:             tools.split(',').map(t => t.trim()).filter(Boolean),
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: json.error ?? 'Save failed', variant: 'destructive' })
        return
      }
      toast({ title: 'Saved to review queue!' })
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishNow() {
    if (!extracted) return
    setPublishing(true)
    try {
      // Save to queue first, then immediately publish
      const saveRes = await fetch('/api/ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({
          platform,
          source_url:  url || 'manual',
          raw_content: content,
          extracted: {
            ...extracted,
            title:             title,
            description:       description,
            category:          category,
            why_clever:        whyClever,
            estimated_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
            tools:             tools.split(',').map(t => t.trim()).filter(Boolean),
          },
        }),
      })
      const saveJson = await saveRes.json()
      if (!saveRes.ok || !saveJson.data?.id) {
        toast({ title: saveJson.error ?? 'Save failed', variant: 'destructive' })
        return
      }

      const ideaId = saveJson.data.id
      const pubRes = await fetch(`/api/ideas/${ideaId}/publish`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({
          title,
          description,
          category,
          why_clever:        whyClever || null,
          estimated_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
          tools:             tools.split(',').map(t => t.trim()).filter(Boolean),
          steps:             extracted.steps,
        }),
      })
      const pubJson = await pubRes.json()
      if (!pubRes.ok) {
        toast({ title: pubJson.error ?? 'Publish failed', variant: 'destructive' })
        return
      }

      toast({ title: 'Published! 🎉' })
      resetForm()
    } finally {
      setPublishing(false)
    }
  }

  function resetForm() {
    setUrl('')
    setContent('')
    setExtracted(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setWhyClever('')
    setEstMinutes('')
    setTools('')
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Admin Import</h1>
        <Input
          type="password"
          placeholder="Admin secret key"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
        />
        <Button onClick={() => setAuthed(true)} className="w-full">Enter</Button>
      </div>
    )
  }

  const confidence = extracted?.confidence ?? 0
  const confidenceColor =
    confidence >= 0.75 ? 'text-green-400' :
    confidence >= 0.5  ? 'text-yellow-400' : 'text-red-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Import Flow</h1>
        <a href="/admin" className="text-sm text-primary hover:underline">← Review Queue</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left panel: input ── */}
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-5 bg-card space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Source Content</h2>

            {/* Platform selector */}
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    platform === p.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Source URL */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Source URL (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://x.com/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="text-sm"
                />
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center px-3 border border-border rounded-md text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Raw content */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Post / Thread Content <span className="text-destructive">*</span>
              </label>
              <textarea
                className="w-full min-h-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Paste the tweet, LinkedIn post, or Reddit thread here…"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">{content.length} chars</div>
            </div>

            <Button onClick={handleExtract} disabled={extracting || !content.trim()} className="w-full gap-2">
              {extracting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting with Claude…</>
                : <><Wand2 className="h-4 w-4" /> Extract Flow</>
              }
            </Button>
          </div>
        </div>

        {/* ── Right panel: preview + actions ── */}
        <div className="space-y-4">
          {!extracted ? (
            <div className="border border-dashed border-border rounded-xl p-10 flex items-center justify-center text-muted-foreground text-sm">
              Paste content and click Extract Flow →
            </div>
          ) : (
            <div className="border border-border rounded-xl p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Extracted Flow</h2>
                <div className="flex items-center gap-2">
                  {!extracted.is_gtm_flow && (
                    <Badge variant="destructive" className="text-xs">Not a GTM flow</Badge>
                  )}
                  <span className={`text-xs font-mono font-semibold ${confidenceColor}`}>
                    {Math.round(confidence * 100)}% confidence
                  </span>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="text-sm font-medium" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Est. minutes</label>
                    <Input
                      type="number"
                      value={estMinutes}
                      onChange={e => setEstMinutes(e.target.value)}
                      className="text-sm"
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tools (comma-separated)</label>
                  <Input value={tools} onChange={e => setTools(e.target.value)} className="text-sm" placeholder="Zapier, Clay, HubSpot" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Why clever</label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    value={whyClever}
                    onChange={e => setWhyClever(e.target.value)}
                    placeholder="Key insight or time-saving hack…"
                  />
                </div>
              </div>

              {/* Steps preview */}
              {extracted.steps.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Steps ({extracted.steps.length})</label>
                  <ol className="space-y-2">
                    {extracted.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-medium">{step.label}</span>
                          {step.app && <span className="text-muted-foreground"> · {step.app}</span>}
                          {step.action && <p className="text-muted-foreground text-xs mt-0.5">{step.action}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleSaveToQueue}
                  disabled={saving || publishing}
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />
                  }
                  Save to Queue
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handlePublishNow}
                  disabled={saving || publishing || !title || !description}
                >
                  {publishing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Upload className="h-4 w-4" />
                  }
                  Publish Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
