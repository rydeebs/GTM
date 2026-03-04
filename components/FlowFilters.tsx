'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, TOOLS } from '@/lib/utils'
import type { SortOption } from '@/lib/types'

export function FlowFilters() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/flows?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search flows..."
          defaultValue={searchParams.get('q') ?? ''}
          className="pl-9"
          onChange={e => {
            const val = e.target.value
            const params = new URLSearchParams(searchParams.toString())
            if (val) params.set('q', val); else params.delete('q')
            router.push(`/flows?${params.toString()}`)
          }}
        />
      </div>

      {/* Category */}
      <Select
        defaultValue={searchParams.get('category') ?? 'all'}
        onValueChange={v => update('category', v)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tool */}
      <Select
        defaultValue={searchParams.get('tool') ?? 'all'}
        onValueChange={v => update('tool', v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Tool" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tools</SelectItem>
          {TOOLS.map(t => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        defaultValue={(searchParams.get('sort') as SortOption) ?? 'newest'}
        onValueChange={v => update('sort', v)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="top">Top Voted</SelectItem>
          <SelectItem value="trending">Trending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
