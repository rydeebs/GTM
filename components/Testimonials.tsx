'use client'

const testimonials = [
  {
    quote: "We replaced a $4k/month agency with three flows from this library. Setup took an afternoon.",
    name: "Sarah Chen",
    title: "Head of Growth",
    company: "Lattice",
  },
  {
    quote: "Found a Clay + LinkedIn intent flow that now runs 24/7 without us touching it. Game changer for our outbound.",
    name: "Marcus Johnson",
    title: "Revenue Operations",
    company: "Ramp",
  },
  {
    quote: "Our SDR team went from 50 to 200 qualified leads per week after implementing two flows from here.",
    name: "Emily Rodriguez",
    title: "VP of Sales",
    company: "Deel",
  },
  {
    quote: "The ICP scoring flow alone saved us 10 hours a week. Now we only talk to accounts that actually fit.",
    name: "David Park",
    title: "GTM Lead",
    company: "Notion",
  },
  {
    quote: "Finally, automation templates that actually work out of the box. No more rebuilding from blog posts.",
    name: "Rachel Kim",
    title: "Marketing Ops",
    company: "Figma",
  },
  {
    quote: "We've tried every automation library out there. This is the only one built by people who actually do GTM.",
    name: "James Wilson",
    title: "Founder",
    company: "Arc",
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function Testimonials() {
  return (
    <section className="bg-[#121212] border-t border-foreground/10 px-6 sm:px-10 lg:px-16 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/40 mb-3">
            Social proof
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-heading text-white">
            Trusted by Modern GTM Teams
          </h2>
        </div>

        {/* Masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="break-inside-avoid bg-[#141414] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
            >
              {/* Quote */}
              <p className="text-[15px] text-white/80 leading-relaxed mb-5">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar with initials */}
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white/60">
                    {getInitials(testimonial.name)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-white/40">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
