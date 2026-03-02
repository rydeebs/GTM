'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id:          string
  title?:      string
  description?: string
  variant?:    'default' | 'destructive'
}

let toastCount = 0
const listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function dispatch(newToasts: Toast[]) {
  toasts = newToasts
  listeners.forEach(l => l(toasts))
}

export function toast(opts: Omit<Toast, 'id'>) {
  const id = String(++toastCount)
  dispatch([...toasts, { ...opts, id }])
  setTimeout(() => dispatch(toasts.filter(t => t.id !== id)), 4000)
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts)

  const subscribe = useCallback(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  // Subscribe on mount
  if (typeof window !== 'undefined' && !listeners.includes(setState)) {
    listeners.push(setState)
  }

  return { toasts: state, toast }
}
