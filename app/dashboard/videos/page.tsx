"use server"

import { Suspense } from "react"
import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getVideosAction } from "@/actions/videos/video-actions"
import VideosClient from "./_components/videos-client"

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
  
  // Serialize videos for client component
  const serializedVideos = videos.map(video => ({
    videoId: video.videoId,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    publishedAt: video.publishedAt instanceof Date ? video.publishedAt.toISOString() : 
                 (video.publishedAt as any)?.toDate ? (video.publishedAt as any).toDate().toISOString() : 
                 new Date().toISOString(),
    viewCount: video.viewCount,
    channelTitle: video.channelTitle,
    tags: video.tags
  }))

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

          {/* Videos Component with Filters */}
          <VideosClient videos={serializedVideos} />
        </div>
      </section>
    </div>
  )
} 