// ─── Core domain types ────────────────────────────────────────────────────────

export type FlowStatus = 'draft' | 'pending' | 'published'
export type IdeaStatus = 'pending' | 'approved' | 'rejected'
export type Platform   = 'twitter' | 'linkedin' | 'reddit'

export interface FlowStep {
  label:       string
  app:         string
  action:      string
  description: string
}

export interface DiagramNode {
  id:       string
  type?:    string
  position: { x: number; y: number }
  data:     { label: string; app?: string; action?: string }
}

export interface DiagramEdge {
  id:     string
  source: string
  target: string
  type?:  string
}

export interface Flow {
  id:                 string
  title:              string
  description:        string
  tools:              string[]
  category:           string
  steps:              FlowStep[]
  diagram_data:       { nodes: DiagramNode[]; edges: DiagramEdge[] } | null
  source_url:         string | null
  author_id:          string | null
  author_name:        string | null
  status:             FlowStatus
  is_featured:        boolean
  featured_date:      string | null
  estimated_minutes:  number | null
  why_clever:         string | null
  vote_count:         number
  save_count:         number
  fork_count:         number
  forked_from:        string | null
  created_at:         string
  updated_at:         string
}

export interface FlowIdea {
  id:                      string
  source_id:               string | null
  platform:                string
  source_url:              string
  raw_content:             string
  extracted_title:         string | null
  extracted_desc:          string | null
  extracted_tools:         string[]
  extracted_steps:         FlowStep[]
  extracted_category:      string | null
  extracted_why_clever:    string | null
  extracted_estimated_min: number | null
  confidence:              number
  status:                  IdeaStatus
  published_flow_id:       string | null
  reviewed_by:             string | null
  reviewed_at:             string | null
  created_at:              string
}

export interface ScrapeSource {
  id:             string
  platform:       Platform
  handle:         string
  active:         boolean
  last_scraped_at: string | null
  created_at:     string
}

export interface Subscriber {
  id:         string
  email:      string
  active:     boolean
  user_id:    string | null
  created_at: string
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiOk<T>  { data: T;    error?: never }
export interface ApiErr    { error: string; data?: never }
export type ApiResult<T>   = ApiOk<T> | ApiErr

// ─── Filter / sort options for the library ────────────────────────────────────

export type SortOption = 'newest' | 'top' | 'trending'

export interface FlowFilters {
  category?: string
  tool?:     string
  sort?:     SortOption
  q?:        string  // free-text search
}
