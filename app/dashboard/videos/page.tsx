"use server"

import { Suspense } from "react"
import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function VideosPage() {
  console.log("[VideosPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[VideosPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[VideosPage] Rendering videos page for user:", user.userId)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-foreground mb-2">Video Library</h1>
        <p className="text-lg text-muted-foreground">
          Learn from Greg Isenberg's entrepreneurship videos
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full px-4 py-2 pl-10 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
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
        
        <select className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Videos</option>
          <option>This Week's Topic</option>
          <option>By Module</option>
        </select>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for videos - will be populated in Phase 3 */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-200 hover-lift"
          >
            <div className="aspect-video bg-muted" />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                Video Title {i}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Greg Isenberg • 2 days ago
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>15:30</span>
                <span>1.2K views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 