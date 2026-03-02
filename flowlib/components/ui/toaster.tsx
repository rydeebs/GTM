'use client'

import { useToast } from '@/lib/hooks/use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={`rounded-lg border p-4 shadow-lg bg-white ${
            variant === 'destructive' ? 'border-destructive text-destructive' : 'border-border'
          }`}
        >
          {title && <div className="font-semibold text-sm">{title}</div>}
          {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
        </div>
      ))}
    </div>
  )
}
