'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    if (!email) return
    setStatus('loading')
    fetch('/api/unsubscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
      .then(r => setStatus(r.ok ? 'done' : 'error'))
      .catch(() => setStatus('error'))
  }, [email])

  if (!email) {
    return (
      <div className="max-w-sm mx-auto mt-24 text-center space-y-3">
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Invalid unsubscribe link</h2>
        <p className="text-muted-foreground text-sm">No email address was found in this link.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="max-w-sm mx-auto mt-24 text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Unsubscribing {email}…</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="max-w-sm mx-auto mt-24 text-center space-y-4">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold">You&apos;ve been unsubscribed</h2>
        <p className="text-muted-foreground text-sm">
          <strong>{email}</strong> has been removed from our digest.
          You won&apos;t receive any more emails from RunGTM.
        </p>
        <a href="/">
          <Button variant="outline" size="sm">Back to RunGTM</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-24 text-center space-y-4">
      <XCircle className="h-10 w-10 text-destructive mx-auto" />
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t unsubscribe {email}. Please try again or contact us directly.
      </p>
      <Button size="sm" onClick={() => {
        setStatus('loading')
        fetch('/api/unsubscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        })
          .then(r => setStatus(r.ok ? 'done' : 'error'))
          .catch(() => setStatus('error'))
      }}>
        Try Again
      </Button>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
