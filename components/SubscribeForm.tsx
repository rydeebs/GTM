'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'

export function SubscribeForm({ dark = true }: { dark?: boolean }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setDone(true)
        toast({ title: 'Subscribed!', description: 'You\'ll get the Flow of the Day in your inbox.' })
      } else {
        const { error } = await res.json()
        toast({ title: 'Error', description: error ?? 'Could not subscribe.', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className={`text-sm ${dark ? 'text-green-400' : 'text-green-600'} font-medium`}>
        ✓ You&apos;re subscribed! Check your inbox tomorrow.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-sm mx-auto">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className={dark ? 'bg-white/10 border-white/20 text-white placeholder:text-slate-400' : ''}
      />
      <Button type="submit" disabled={loading} variant={dark ? 'secondary' : 'default'}>
        {loading ? '...' : 'Subscribe'}
      </Button>
    </form>
  )
}
