'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'
import { CATEGORIES, TOOLS } from '@/lib/utils'
import type { FlowStep } from '@/lib/types'

const EMPTY_STEP: FlowStep = { label: '', app: '', action: '', description: '' }

export default function SubmitPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('')
  const [tools,       setTools]       = useState<string[]>([])
  const [steps,       setSteps]       = useState<FlowStep[]>([{ ...EMPTY_STEP }])
  const [whyClever,   setWhyClever]   = useState('')
  const [estimatedMin, setEstimatedMin] = useState('')
  const [authorName,  setAuthorName]  = useState('')
  const [sourceUrl,   setSourceUrl]   = useState('')

  function toggleTool(tool: string) {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])
  }

  function updateStep(index: number, field: keyof FlowStep, value: string) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function addStep() {
    setSteps(prev => [...prev, { ...EMPTY_STEP }])
  }

  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title || !description || !category || tools.length === 0 || steps.length === 0) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/flows', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          tools,
          steps: steps.map(s => ({ ...s, label: s.label || s.app })),
          why_clever:        whyClever || undefined,
          estimated_minutes: estimatedMin ? parseInt(estimatedMin) : undefined,
          author_name:       authorName || undefined,
          source_url:        sourceUrl  || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: json.error ?? 'Something went wrong.', variant: 'destructive' })
        return
      }

      toast({ title: 'Flow submitted!', description: 'Your flow is now live.' })
      router.push(`/flows/${json.data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit a Flow</h1>
        <p className="text-muted-foreground">Share your best GTM automation with the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="e.g. Enrich leads with Clay → push to HubSpot" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description *</Label>
          <Textarea id="desc" placeholder="What does this flow do? Who is it for? What problem does it solve?" rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tools */}
        <div className="space-y-2">
          <Label>Tools * <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map(tool => (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  tools.includes(tool)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <Label>Steps * <span className="text-muted-foreground text-xs">(add each step in order)</span></Label>
          {steps.map((step, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">App / Tool</Label>
                  <Input placeholder="e.g. Clay" value={step.app} onChange={e => updateStep(i, 'app', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Action</Label>
                  <Input placeholder="e.g. Enrich contact" value={step.action} onChange={e => updateStep(i, 'action', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description (optional)</Label>
                <Input placeholder="What happens in this step?" value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>

        {/* Why clever */}
        <div className="space-y-1.5">
          <Label htmlFor="why">Why is this flow clever? <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="why" placeholder="e.g. Cuts manual research from 2h to 5 min per lead" value={whyClever} onChange={e => setWhyClever(e.target.value)} />
        </div>

        {/* Estimated time */}
        <div className="space-y-1.5">
          <Label htmlFor="time">Estimated build time (minutes) <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="time" type="number" placeholder="e.g. 30" value={estimatedMin} onChange={e => setEstimatedMin(e.target.value)} />
        </div>

        {/* Author + source */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="author">Your name <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="author" placeholder="e.g. Alex" value={authorName} onChange={e => setAuthorName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="source" type="url" placeholder="https://twitter.com/..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Flow'}
        </Button>
      </form>
    </div>
  )
}
