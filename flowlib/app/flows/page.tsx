import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { FlowCard } from '@/components/FlowCard'
import { FlowFilters } from '@/components/FlowFilters'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Flow, SortOption } from '@/lib/types'

const PAGE_SIZE = 12

interface Props {
  searchParams: {
    category?: string
    tool?:     string
    sort?:     SortOption
    q?:        string
    page?:     string
  }
}

export default async function FlowsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const page     = parseInt(searchParams.page ?? '1', 10)
  const { category, tool, sort = 'newest', q } = searchParams

  let query = supabase
    .from('flows')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  if (category) query = query.eq('category', category)
  if (tool)     query = query.contains('tools', [tool])
  if (q)        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  if (sort === 'top')       query = query.order('vote_count', { ascending: false })
  else if (sort === 'trending') query = query.order('vote_count', { ascending: false }).order('created_at', { ascending: false })
  else                          query = query.order('created_at', { ascending: false })

  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data: flows, count } = await query as { data: Flow[] | null; count: number | null }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const hasNext    = page < totalPages
  const hasPrev    = page > 1

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (tool)     params.set('tool', tool)
    if (sort)     params.set('sort', sort)
    if (q)        params.set('q', q)
    params.set('page', String(p))
    return `/flows?${params.toString()}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Flow Library</h1>
          <p className="text-muted-foreground mt-1">
            {count ?? 0} flows across Zapier, Clay, Make, and more
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/submit">+ Submit</Link>
        </Button>
      </div>

      <Suspense>
        <FlowFilters />
      </Suspense>

      {flows && flows.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map(flow => <FlowCard key={flow.id} flow={flow} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {hasPrev && (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageUrl(page - 1)}>← Previous</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {hasNext && (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageUrl(page + 1)}>Next →</Link>
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No flows found</p>
          <p className="text-sm mb-4">Try adjusting your filters or be the first to submit one!</p>
          <Button asChild>
            <Link href="/submit">Submit a Flow</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
