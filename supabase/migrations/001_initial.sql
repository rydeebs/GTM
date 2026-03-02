-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── FLOWS ────────────────────────────────────────────────────────────────────
create table public.flows (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text not null,
  tools        text[] not null default '{}',
  category     text not null,
  steps        jsonb not null default '[]',  -- [{label, app, action, description}]
  diagram_data jsonb,                         -- ReactFlow nodes/edges
  source_url   text,
  author_id    uuid references auth.users(id) on delete set null,
  author_name  text,
  status       text not null default 'published' check (status in ('draft','pending','published')),
  is_featured  boolean not null default false,
  featured_date date,
  estimated_minutes int,
  why_clever   text,
  vote_count   int not null default 0,
  save_count   int not null default 0,
  fork_count   int not null default 0,
  forked_from  uuid references public.flows(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index flows_category_idx on public.flows(category);
create index flows_status_idx   on public.flows(status);
create index flows_tools_idx    on public.flows using gin(tools);
create index flows_featured_idx on public.flows(is_featured, featured_date desc);
create index flows_votes_idx    on public.flows(vote_count desc);

-- ─── VOTES ────────────────────────────────────────────────────────────────────
create table public.votes (
  id         uuid primary key default uuid_generate_v4(),
  flow_id    uuid not null references public.flows(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  ip_hash    text,  -- for anonymous voting
  created_at timestamptz not null default now(),
  unique(flow_id, user_id),
  unique(flow_id, ip_hash)
);

-- ─── SAVES ────────────────────────────────────────────────────────────────────
create table public.saves (
  id         uuid primary key default uuid_generate_v4(),
  flow_id    uuid not null references public.flows(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(flow_id, user_id)
);

-- ─── SUBSCRIBERS (email digest) ───────────────────────────────────────────────
create table public.subscribers (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  active     boolean not null default true,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── SCRAPE SOURCES ──────────────────────────────────────────────────────────
create table public.scrape_sources (
  id         uuid primary key default uuid_generate_v4(),
  platform   text not null check (platform in ('twitter','linkedin','reddit')),
  handle     text not null,  -- @username, linkedin URL, or subreddit
  active     boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now(),
  unique(platform, handle)
);

-- ─── FLOW IDEAS (scraped + Claude-processed) ──────────────────────────────────
create table public.flow_ideas (
  id               uuid primary key default uuid_generate_v4(),
  source_id        uuid references public.scrape_sources(id) on delete set null,
  platform         text not null,
  source_url       text not null,
  raw_content      text not null,
  extracted_title  text,
  extracted_desc   text,
  extracted_tools  text[] default '{}',
  extracted_steps  jsonb default '[]',
  confidence       numeric(3,2) default 0,  -- 0.00–1.00
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  published_flow_id uuid references public.flows(id) on delete set null,
  reviewed_by      uuid references auth.users(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index flow_ideas_status_idx on public.flow_ideas(status, created_at desc);

-- ─── TRIGGER: update flows.updated_at ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger flows_updated_at
  before update on public.flows
  for each row execute procedure update_updated_at();

-- ─── TRIGGER: maintain vote_count on flows ────────────────────────────────────
create or replace function sync_vote_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.flows set vote_count = vote_count + 1 where id = new.flow_id;
  elsif (tg_op = 'DELETE') then
    update public.flows set vote_count = greatest(0, vote_count - 1) where id = old.flow_id;
  end if;
  return null;
end;
$$;

create trigger votes_sync
  after insert or delete on public.votes
  for each row execute procedure sync_vote_count();

-- ─── TRIGGER: maintain save_count on flows ────────────────────────────────────
create or replace function sync_save_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.flows set save_count = save_count + 1 where id = new.flow_id;
  elsif (tg_op = 'DELETE') then
    update public.flows set save_count = greatest(0, save_count - 1) where id = old.flow_id;
  end if;
  return null;
end;
$$;

create trigger saves_sync
  after insert or delete on public.saves
  for each row execute procedure sync_save_count();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.flows         enable row level security;
alter table public.votes         enable row level security;
alter table public.saves         enable row level security;
alter table public.subscribers   enable row level security;
alter table public.scrape_sources enable row level security;
alter table public.flow_ideas    enable row level security;

-- Flows: anyone can read published; author or admin can write
create policy "flows_read"   on public.flows for select using (status = 'published');
create policy "flows_insert" on public.flows for insert with check (auth.uid() = author_id);
create policy "flows_update" on public.flows for update using (auth.uid() = author_id);

-- Votes: anyone can insert (with ip_hash) or logged-in users
create policy "votes_read"   on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (true);
create policy "votes_delete" on public.votes for delete using (auth.uid() = user_id);

-- Saves: user-scoped
create policy "saves_read"   on public.saves for select using (auth.uid() = user_id);
create policy "saves_insert" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves_delete" on public.saves for delete using (auth.uid() = user_id);

-- Subscribers: user-scoped (allow anon insert for email-only signup)
create policy "subs_insert" on public.subscribers for insert with check (true);
create policy "subs_read"   on public.subscribers for select using (auth.uid() = user_id);

-- Scrape sources & ideas: service role only (managed via API routes with service key)
create policy "scrape_sources_service" on public.scrape_sources for all using (false);
create policy "flow_ideas_service"     on public.flow_ideas     for all using (false);

-- Seed some starter scrape sources
insert into public.scrape_sources (platform, handle) values
  ('twitter',  '@zapier'),
  ('twitter',  '@clay_hq'),
  ('twitter',  '@levelsio'),
  ('reddit',   'r/automation'),
  ('reddit',   'r/zapier'),
  ('reddit',   'r/nocode');
