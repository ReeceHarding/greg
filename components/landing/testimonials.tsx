/*
<ai_context>
This client component provides a Twitter-style testimonials carousel.
Shows young entrepreneurs who made money using AI to inspire students.
</ai_context>
*/

"use client"

import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bookmark
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Testimonial {
  name: string
  handle: string
  avatar: string
  role: string
  company: string
  content: string
  videoPoster: string
  videoSrc: string
  likes: number
  retweets: number
  comments: number
  timeAgo: string
  verified?: boolean
}

const testimonials: Testimonial[] = [
  {
    name: "Pieter Levels",
    handle: "levelsio",
    avatar: "https://unavatar.io/twitter/levelsio",
    role: "Founder",
    company: "PhotoAI & NomadList",
    content:
      "Built PhotoAI to $75k MRR in 4 months. All solo, all with AI. No VC money, no team, just me and GPT-4. If you're not using AI to build, you're already behind. Stop learning outdated coding - learn AI prompting instead.",
    videoPoster:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 4892,
    retweets: 736,
    comments: 124,
    timeAgo: "2d",
    verified: true
  },
  {
    name: "Danny Postma",
    handle: "dannypostma",
    avatar: "https://unavatar.io/twitter/dannypostma",
    role: "Indie Hacker",
    company: "Headshot Pro",
    content:
      "Made $300k in 6 months with HeadshotPro. Used AI to automate everything. College dropouts are making more than MBAs now. The game has changed. Build with AI or get left behind.",
    videoPoster:
      "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 3523,
    retweets: 497,
    comments: 218,
    timeAgo: "1w",
    verified: true
  },
  {
    name: "Tony Dinh",
    handle: "tdinh_me",
    avatar: "https://unavatar.io/twitter/tdinh_me",
    role: "Solo Founder",
    company: "TypingMind",
    content:
      "Hit $500k ARR with TypingMind. Started as a weekend project. Now making more than my Silicon Valley salary. The secret? Ship fast with AI, iterate based on feedback. That's it.",
    videoPoster:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 2843,
    retweets: 418,
    comments: 342,
    timeAgo: "3d",
    verified: true
  },
  {
    name: "Marc Lou",
    handle: "marc_louvion",
    avatar: "https://unavatar.io/twitter/marc_louvion",
    role: "Serial Builder",
    company: "ShipFast",
    content:
      "Made $242k last year shipping AI products. 12 products in 12 months. Average build time: 2 weeks. My advice to students: Stop overthinking, start shipping. AI makes it stupid easy now.",
    videoPoster:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 5789,
    retweets: 856,
    comments: 431,
    timeAgo: "5d",
    verified: true
  },
  {
    name: "Andrey Azimov",
    handle: "AndreyAzimov",
    avatar: "https://unavatar.io/twitter/AndreyAzimov",
    role: "20 y/o Founder",
    company: "Sheet2Site",
    content:
      "Dropped out at 19. Now making $40k/mo with AI tools. My parents said I was crazy. Now I make more than both of them combined. If you're young and not building with AI, what are you waiting for?",
    videoPoster:
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 3456,
    retweets: 589,
    comments: 127,
    timeAgo: "1w"
  },
  {
    name: "Yannick Veys",
    handle: "yannick_veys",
    avatar: "https://unavatar.io/twitter/yannick_veys",
    role: "22 y/o Entrepreneur",
    company: "Hypefury",
    content:
      "Started at 20, hit $1M ARR at 22. All bootstrapped. The cheat code? AI + Twitter + solving real problems. Skip the degree, build products. Your GitHub is your new resume.",
    videoPoster:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
    videoSrc: "",
    likes: 4678,
    retweets: 724,
    comments: 238,
    timeAgo: "2w",
    verified: true
  }
]

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article
      className="mx-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all hover:scale-[1.02]"
      style={{ width: "320px", height: "420px" }}
    >
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start gap-3">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="size-10 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-900">
                {testimonial.name}
              </span>
              {testimonial.verified && (
                <svg
                  className="size-3.5 shrink-0 text-purple-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">@{testimonial.handle}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500">{testimonial.timeAgo}</span>
            </div>
          </div>
          <button className="rounded-full p-1.5 transition-colors hover:bg-gray-100">
            <svg
              className="size-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-3 flex-1 text-[15px] leading-normal text-gray-900">
          {testimonial.content}
        </div>

        {/* Company badge */}
        <div className="mb-4">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {testimonial.role} · {testimonial.company}
          </Badge>
        </div>

        {/* Actions */}
        <div className="-mx-2 flex items-center justify-between border-t pt-3">
          <button className="group/btn flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-purple-50">
            <MessageCircle className="size-4 text-gray-500 group-hover/btn:text-purple-600" />
            <span className="text-xs text-gray-500 group-hover/btn:text-purple-600">
              {testimonial.comments}
            </span>
          </button>
          <button className="group/btn flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-green-50">
            <Repeat2 className="size-4 text-gray-500 group-hover/btn:text-green-600" />
            <span className="text-xs text-gray-500 group-hover/btn:text-green-600">
              {testimonial.retweets}
            </span>
          </button>
          <button className="group/btn flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-red-50">
            <Heart className="size-4 text-gray-500 group-hover/btn:text-red-600" />
            <span className="text-xs text-gray-500 group-hover/btn:text-red-600">
              {testimonial.likes}
            </span>
          </button>
          <button className="group/btn rounded-full p-2 transition-colors hover:bg-blue-50">
            <Share className="size-4 text-gray-500 group-hover/btn:text-blue-600" />
          </button>
          <button className="group/btn rounded-full p-2 transition-colors hover:bg-blue-50">
            <Bookmark className="size-4 text-gray-500 group-hover/btn:text-blue-600" />
          </button>
        </div>
      </div>
    </article>
  )
}

export function TestimonialsSection() {
  console.log("[TestimonialsSection] Rendering testimonials")

  return (
    <section className="py-16 md:py-24" id="testimonials">
      <div className="mb-12 text-center">
        <h2 className="text-primary font-mono text-sm font-bold uppercase tracking-wider">
          Success Stories
        </h2>
        <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">
          Young entrepreneurs making{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            serious money with AI
          </span>
        </h3>
        <p className="text-muted-foreground mt-4 text-lg">
          Real tweets from founders who learned AI and changed their lives
        </p>
      </div>

      {/* Marquee container */}
      <div className="relative">
        <div className="group flex flex-row overflow-hidden p-2 [--duration:80s] [--gap:1rem] [gap:var(--gap)]">
          {/* First set of testimonials */}
          <div className="animate-marquee flex shrink-0 flex-row justify-around [gap:var(--gap)] group-hover:[animation-play-state:paused]">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`first-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>

          {/* Duplicate set for seamless loop */}
          <div
            className="animate-marquee flex shrink-0 flex-row justify-around [gap:var(--gap)] group-hover:[animation-play-state:paused]"
            aria-hidden="true"
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`second-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>

        {/* Gradient overlays */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
      </div>
    </section>
  )
}
