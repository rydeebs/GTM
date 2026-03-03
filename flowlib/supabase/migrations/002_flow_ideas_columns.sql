-- Add extraction fields that Claude now returns but weren't in the original schema
alter table public.flow_ideas
  add column if not exists extracted_category      text,
  add column if not exists extracted_why_clever    text,
  add column if not exists extracted_estimated_min int,
  add column if not exists is_gtm_flow             boolean not null default true;
