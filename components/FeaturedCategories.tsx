'use client'

import Link from 'next/link'
import { ArrowRight, Mail, Users, Target, Linkedin, BarChart3, Send, Database, Flame } from 'lucide-react'

const categories = [
  { name: 'Cold Outbound', count: 34, icon: Send, slug: 'cold-outbound' },
  { name: 'Lead Enrichment', count: 28, icon: Users, slug: 'lead-enrichment' },
  { name: 'Intent Signals', count: 19, icon: Target, slug: 'intent-signals' },
  { name: 'LinkedIn Automation', count: 42, icon: Linkedin, slug: 'linkedin-automation' },
  { name: 'ICP Scoring', count: 15, icon: BarChart3, slug: 'icp-scoring' },
  { name: 'Email Sequences', count: 56, icon: Mail, slug: 'email-sequences' },
  { name: 'CRM Ops', count: 31, icon: Database, slug: 'crm-ops' },
  { name: 'Warm Outbound', count: 23, icon: Flame, slug: 'warm-outbound' },
]

export function FeaturedCategories() {
  return (
    <section className="bg-[#0d0d0d] border-t border-white/[0.08] px-6 sm:px-10 lg:px-16 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/40 mb-2">
              Categories
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-white">
              Browse by Category
            </h2>
          </div>
          <Link
            href="/flows"
            className="text-sm text-white/45 hover:text-white transition-colors flex items-center gap-1"
          >
            View all flows <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.slug}
                href={`/flows?category=${category.slug}`}
                className="group relative flex flex-col p-5 sm:p-6 rounded-xl border border-white/[0.08] bg-transparent transition-all duration-200 hover:border-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-[#3b82f6]/30 transition-colors">
                  <Icon className="w-5 h-5 text-white/50 group-hover:text-[#3b82f6] transition-colors" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight mb-1 group-hover:text-white transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-white/30">
                  {category.count} flows
                </p>

                {/* Subtle arrow indicator on hover */}
                <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-white/0 group-hover:text-[#3b82f6]/60 transition-all duration-200 group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
