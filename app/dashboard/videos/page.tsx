"use server"

import { Suspense } from "react"
import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getVideosAction } from "@/actions/videos/video-actions"
import Link from "next/link"

export default async function VideosPage() {
  console.log("[VideosPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[VideosPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[VideosPage] Rendering videos page for user:", user.userId)
  
  // Fetch real videos from database
  const videosResult = await getVideosAction()
  const videos = videosResult.isSuccess ? videosResult.data || [] : []
  
  console.log(`[VideosPage] Fetched ${videos.length} videos from database`)

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Video Library
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Learn from Greg Isenberg's proven strategies for building AI-powered businesses
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <input
                  type="text"
                  placeholder="Search for specific topics, strategies, or keywords..."
                  className="w-full px-6 py-4 pl-14 bg-white/80 backdrop-blur-sm border border-border/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                />
                <svg
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              {/* Filter Dropdown */}
              <select className="px-6 py-4 bg-white/80 backdrop-blur-sm border border-border/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2714%27%20height%3D%278%27%20viewBox%3D%270%200%2014%208%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201l6%206%206-6%27%20stroke%3D%27%236B7280%27%20stroke-width%3D%272%27%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.5rem_center] bg-no-repeat pr-12">
                <option>All Videos</option>
                <option>This Week's Topic: Building an Audience</option>
                <option>Week 1: Finding Your Niche</option>
                <option>Week 2: MVP Development</option>
                <option>Week 3-4: Iteration</option>
                <option>Week 5-6: Marketing & Growth</option>
                <option>Week 7-8: Monetization</option>
              </select>
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Showing:</span>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full border border-primary/20">
                <span className="font-medium">All Videos</span>
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">42 videos</span>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No videos available yet.</p>
                <button
                  onClick={async () => {
                    const response = await fetch('/api/youtube/import', { method: 'POST' })
                    if (response.ok) window.location.reload()
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-all duration-200"
                >
                  Import Videos from YouTube
                </button>
              </div>
            ) : (
              videos.map((video) => {
                // Calculate days ago
                const publishedDate = video.publishedAt ? 
                  (video.publishedAt as any).toDate?.() || new Date(video.publishedAt as any) : 
                  new Date()
                const daysAgo = Math.floor((new Date().getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
                
                // Format duration
                const formatDuration = (seconds: number) => {
                  const minutes = Math.floor(seconds / 60)
                  const secs = seconds % 60
                  return `${minutes}:${secs.toString().padStart(2, '0')}`
                }
                
                // Format view count
                const formatViews = (count: number) => {
                  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
                  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
                  return count.toString()
                }
                
                return (
                  <Link
                    key={video.videoId}
                    href={`/dashboard/videos/${video.videoId}`}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:scale-[1.02] block"
                  >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                    {formatDuration(video.duration)}
                  </div>

                  {/* New Badge (for recent videos) */}
                  {daysAgo <= 3 && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-md">
                      NEW
                    </div>
                  )}
                </div>

                {/* Video Details */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xs font-semibold">
                        GI
                      </div>
                      <span>Greg Isenberg</span>
                    </div>
                    <span>•</span>
                    <span>{daysAgo} days ago</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatViews(video.viewCount)} views
                    </span>
                    <span className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                      Watch Now →
                    </span>
                  </div>
                </div>
              </Link>
                )
              })
            )}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-full font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200">
              <span>Load More Videos</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
} 