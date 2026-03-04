import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rungtm.com'
  const supabase = createServiceClient()

  const { data: flows } = await supabase
    .from('flows')
    .select('id, updated_at, category')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1000)

  const flowUrls: MetadataRoute.Sitemap = (flows ?? []).map((flow: { id: string; updated_at: string; category: string }) => ({
    url:             `${baseUrl}/flows/${flow.id}`,
    lastModified:    new Date(flow.updated_at),
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  return [
    {
      url:             baseUrl,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1,
    },
    {
      url:             `${baseUrl}/flows`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.9,
    },
    {
      url:             `${baseUrl}/submit`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.6,
    },
    ...flowUrls,
  ]
}
