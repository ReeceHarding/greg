"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import ImportVideosButton from "./import-videos-button"

interface SerializedVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  duration: number
  publishedAt: string
  viewCount: number
  channelTitle: string
  tags: string[]
}

interface VideosClientProps {
  videos: SerializedVideo[]
}

export default function VideosClient({ videos }: VideosClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWeek, setSelectedWeek] = useState("all")
  
  // Filter videos based on search and week
  const filteredVideos = useMemo(() => {
    let filtered = videos
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Week filter
    if (selectedWeek !== "all") {
      // Simple week filtering based on tags or title
      const weekFilters: Record<string, string[]> = {
        "audience": ["audience", "community", "engagement"],
        "week1": ["week 1", "niche", "finding your niche"],
        "week2": ["week 2", "mvp", "minimum viable"],
        "week3-4": ["week 3", "week 4", "iteration", "feedback"],
        "week5-6": ["week 5", "week 6", "marketing", "growth"],
        "week7-8": ["week 7", "week 8", "monetization", "revenue"]
      }
      
      const keywords = weekFilters[selectedWeek] || []
      filtered = filtered.filter(video => {
        const searchText = `${video.title} ${video.description} ${video.tags.join(' ')}`.toLowerCase()
        return keywords.some(keyword => searchText.includes(keyword))
      })
    }
    
    return filtered
  }, [videos, searchQuery, selectedWeek])
  
  // Helper functions
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }
  
  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  return (
    <div>
      {/* Search and Filter Section */}
      <div className="mb-12 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search for specific topics, strategies, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <select 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-6 py-4 bg-white/80 backdrop-blur-sm border border-border/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2714%27%20height%3D%278%27%20viewBox%3D%270%200%2014%208%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201l6%206%206-6%27%20stroke%3D%27%236B7280%27%20stroke-width%3D%272%27%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.5rem_center] bg-no-repeat pr-12"
          >
            <option value="all">All Videos</option>
            <option value="audience">This Week's Topic: Building an Audience</option>
            <option value="week1">Week 1: Finding Your Niche</option>
            <option value="week2">Week 2: MVP Development</option>
            <option value="week3-4">Week 3-4: Iteration</option>
            <option value="week5-6">Week 5-6: Marketing & Growth</option>
            <option value="week7-8">Week 7-8: Monetization</option>
          </select>
        </div>

        {/* Active Filters */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Showing:</span>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full border border-primary/20">
            <span className="font-medium">
              {selectedWeek === "all" ? "All Videos" : 
               selectedWeek === "audience" ? "Building an Audience" :
               selectedWeek === "week1" ? "Week 1: Finding Your Niche" :
               selectedWeek === "week2" ? "Week 2: MVP Development" :
               selectedWeek === "week3-4" ? "Week 3-4: Iteration" :
               selectedWeek === "week5-6" ? "Week 5-6: Marketing & Growth" :
               "Week 7-8: Monetization"}
            </span>
            <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedWeek !== "all" 
                ? "No videos match your search criteria." 
                : "No videos available yet."}
            </p>
            {videos.length === 0 && <ImportVideosButton />}
          </div>
        ) : (
          filteredVideos.map((video) => {
            const daysAgo = getDaysAgo(video.publishedAt)
            
            return (
              <Link
                key={video.videoId}
                href={`/dashboard/videos/${video.videoId}`}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:scale-[1.02] block"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
                  {/* Actual Thumbnail Image */}
                  {video.thumbnailUrl && (
                    <Image 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  
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
                      <span>{video.channelTitle}</span>
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
    </div>
  )
} 