import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FlowStep, DiagramNode, DiagramEdge } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60)   return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function formatMinutes(minutes: number | null): string {
  if (!minutes) return 'Unknown'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Auto-generate ReactFlow nodes + edges from a flat steps array */
export function stepsTodiagram(
  steps: FlowStep[]
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const XGAP = 0
  const YGAP = 120

  const nodes: DiagramNode[] = steps.map((step, i) => ({
    id:       String(i),
    position: { x: 250, y: i * YGAP },
    data:     { label: step.label || step.app, app: step.app, action: step.action },
  }))

  const edges: DiagramEdge[] = steps.slice(1).map((_, i) => ({
    id:     `e${i}-${i + 1}`,
    source: String(i),
    target: String(i + 1),
    type:   'smoothstep',
  }))

  return { nodes, edges }
}

export const CATEGORIES = [
  'Lead Generation',
  'Sales Automation',
  'Marketing',
  'Data Enrichment',
  'Outreach',
  'CRM',
  'Analytics',
  'Notifications',
  'Content',
  'HR & Ops',
  'Finance',
  'Other',
] as const

export type Category = typeof CATEGORIES[number]

export const TOOLS = [
  'Zapier', 'Clay', 'Make', 'n8n', 'HubSpot', 'Salesforce',
  'Slack', 'Gmail', 'Google Sheets', 'Airtable', 'Notion',
  'Apollo', 'Clearbit', 'Hunter.io', 'LinkedIn', 'OpenAI',
  'Anthropic', 'Instantly', 'Lemlist', 'Webhooks', 'Other',
] as const
