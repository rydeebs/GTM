import Link from 'next/link'
import { ArrowRight, ArrowUp, Bookmark, GitFork } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WebGLBackground } from '@/components/WebGLBackground'
import { HowItWorks } from '@/components/HowItWorks'
import { FeaturedCategories } from '@/components/FeaturedCategories'
import { Testimonials } from '@/components/Testimonials'
import { LogoMarquee } from '@/components/LogoMarquee'
import type { Flow } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: topFlows } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'published')
    .order('vote_count', { ascending: false })
    .limit(6) as { data: Flow[] | null }

  const { data: recentFlows } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12) as { data: Flow[] | null }

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-center px-6 pt-28 pb-20">
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Headline */}
          <div className="relative mb-8 py-4">
            <h1 className="relative z-10 text-[3.2rem] sm:text-[4.25rem] lg:text-[5.3rem] font-black leading-[1.05] tracking-tight font-heading">
              <span className="block">Discover &amp; Run</span>
              <span className="block text-foreground/25">the best</span>
              <span className="block">GTM Automation Flows</span>
            </h1>
          </div>

          <p className="text-lg text-foreground/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Browse, fork, and deploy automation flows — curated by the GTM community.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Link
              href="/flows"
              className="inline-flex items-center gap-2 bg-[#3b82f6] text-white text-sm font-bold px-7 py-3 rounded-full hover:bg-[#60a5fa] active:bg-[#1d4ed8] transition-colors"
            >
              Browse Flows <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 border border-foreground/20 text-sm font-medium px-7 py-3 rounded-full hover:bg-foreground/5 transition-colors"
            >
              Submit a Flow
            </Link>
          </div>

          {/* Logo Marquee */}
          <LogoMarquee />
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="border-t border-dashed border-foreground/10">
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-dashed divide-foreground/10">
          {[
            { value: '500+', label: 'Automation Flows' },
            { value: '40+',  label: 'Tools Covered'    },
            { value: '2k+',  label: 'Subscribers'      },
          ].map(stat => (
            <div key={stat.label} className="py-10 text-center">
              <div className="text-4xl font-black tracking-tight">{stat.value}</div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-foreground/40 mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Featured Categories ───────────────────────────────────────── */}
      <FeaturedCategories />

      {/* ── Top Flows ─────────────────────────────────────────────────── */}
      {topFlows && topFlows.length > 0 && (
        <section className="border-t border-dashed border-foreground/10 px-6 sm:px-10 lg:px-16 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/40 mb-2">
                  Community picks
                </p>
                <h2 className="text-3xl font-black tracking-tight font-heading">Top Flows</h2>
              </div>
              <Link
                href="/flows?sort=top"
                className="text-sm text-foreground/45 hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-foreground/8 divide-y md:divide-y-0 md:divide-x divide-foreground/8">
              {topFlows.map(flow => (
                <FlowTile key={flow.id} flow={flow} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Dark CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0d0d0d] px-6 sm:px-10 lg:px-16 py-16">
        <WebGLBackground variant="dark" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[0.95] tracking-tight mb-5 font-heading">
            Get One Flow,
            <br />
            <span className="text-white/25 font-light italic">Every Single Day</span>
          </h2>
          <p className="text-white/40 text-base max-w-md mx-auto mb-8 leading-relaxed">
            A hand-picked GTM automation explained in full detail, delivered to
            your inbox every morning.
          </p>
          <div className="max-w-lg mx-auto">
            <div className="flex items-stretch rounded-2xl overflow-hidden bg-white/8 ring-1 ring-white/15 backdrop-blur-sm shadow-2xl">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 min-w-0 px-5 py-4 text-sm bg-transparent text-white placeholder:text-white/40 outline-none"
              />
              <div className="w-px bg-white/15 my-3" />
              <input
                type="text"
                placeholder="Full name"
                className="flex-1 min-w-0 px-5 py-4 text-sm bg-transparent text-white placeholder:text-white/40 outline-none"
              />
              <button className="px-6 py-4 m-1.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold hover:bg-[#60a5fa] transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── Recent flows showcase ─────────────────────────────────────── */}
      {recentFlows && recentFlows.length > 0 && (
        <section className="border-t border-dashed border-foreground/10 px-6 sm:px-10 lg:px-16 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/40 mb-2">
                  Just added
                </p>
                <h2 className="text-3xl font-black tracking-tight font-heading">Recent Flows</h2>
              </div>
              <Link
                href="/flows"
                className="text-sm text-foreground/45 hover:text-foreground transition-colors flex items-center gap-1"
              >
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none">
              {recentFlows.map(flow => (
                <Link
                  key={flow.id}
                  href={`/flows/${flow.id}`}
                  className="flex-shrink-0 w-56 snap-start bg-card border border-white/8 p-5 hover:border-[#3b82f6]/40 hover:shadow-sm transition-all group"
                >
                  <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-foreground/40 border border-foreground/12 px-2 py-0.5 rounded-full mb-3">
                    {flow.category}
                  </span>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-[#3b82f6] transition-colors line-clamp-2 mb-3">
                    {flow.title}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {flow.tools.slice(0, 3).map(tool => (
                      <span key={tool} className="text-[10px] bg-foreground/5 text-foreground/45 px-2 py-0.5 rounded-full">
                        {tool}
                      </span>
                    ))}
                    {flow.tools.length > 3 && (
                      <span className="text-[10px] text-foreground/30">+{flow.tools.length - 3}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}

/* ── Flow tile used in the top-flows grid ────────────────────────────────── */
function FlowTile({ flow }: { flow: Flow }) {
  return (
    <Link href={`/flows/${flow.id}`} className="block group bg-card p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-foreground/40 border border-foreground/12 px-2 py-0.5 rounded-full">
          {flow.category}
        </span>
        <span className="text-[11px] text-foreground/30 flex items-center gap-0.5 shrink-0">
          <ArrowUp className="h-3 w-3" />{flow.vote_count}
        </span>
      </div>
      <h3 className="font-bold text-base leading-snug group-hover:text-[#3b82f6] transition-colors line-clamp-2 mb-2">
        {flow.title}
      </h3>
      <p className="text-sm text-foreground/45 line-clamp-2 mb-4">{flow.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {flow.tools.slice(0, 4).map(tool => (
          <span key={tool} className="text-[10px] bg-foreground/5 text-foreground/45 px-2 py-0.5 rounded-full">
            {tool}
          </span>
        ))}
        {flow.tools.length > 4 && (
          <span className="text-[10px] text-foreground/30">+{flow.tools.length - 4}</span>
        )}
      </div>
      {flow.steps.length > 0 && (
        <div className="flex items-center gap-1 mt-4 text-[11px] text-foreground/30 overflow-hidden">
          {flow.steps.slice(0, 3).map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>→</span>}
              <span className="bg-foreground/5 px-1.5 py-0.5 rounded truncate max-w-[80px]">{step.app}</span>
            </span>
          ))}
          {flow.steps.length > 3 && <span>→ +{flow.steps.length - 3}</span>}
        </div>
      )}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dashed border-foreground/8 text-[11px] text-foreground/30">
        {flow.fork_count > 0 && (
          <span className="flex items-center gap-0.5"><GitFork className="h-3 w-3" />{flow.fork_count}</span>
        )}
        <span className="flex items-center gap-0.5"><Bookmark className="h-3 w-3" />{flow.save_count}</span>
        {flow.author_name && <span>by {flow.author_name}</span>}
      </div>
    </Link>
  )
}
