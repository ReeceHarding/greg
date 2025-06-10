"use server"

import { Suspense } from "react"
import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getVideosAction } from "@/actions/videos/video-actions"
import ProgressClient from "./_components/progress-client"
import { Loader2 } from "lucide-react"

export default async function ProgressPage() {
  console.log("[ProgressPage] Checking authentication")
  const authResult = await auth()
  
  if (!authResult.user) {
    console.log("[ProgressPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[ProgressPage] Rendering progress page for user:", authResult.user.uid)

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Your Progress
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Track your journey through AI Summer Camp and celebrate your achievements
            </p>
          </div>

          {/* Progress Content */}
          <Suspense fallback={<ProgressSkeleton />}>
            <ProgressDataFetcher userId={authResult.user.uid} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

async function ProgressDataFetcher({ userId }: { userId: string }) {
  console.log("[ProgressDataFetcher] Fetching data for progress page")
  
  // Fetch assignments and videos data
  const [assignmentsResult, videosResult] = await Promise.all([
    getAllAssignmentsAction(),
    getVideosAction()
  ])
  
  if (!assignmentsResult.isSuccess || !assignmentsResult.data) {
    console.error("[ProgressDataFetcher] Failed to fetch assignments")
    return <div className="text-center py-12 text-muted-foreground">Failed to load assignments</div>
  }
  
  const totalVideos = videosResult.isSuccess ? (videosResult.data?.length || 0) : 0
  
  // Assignments are already serialized by getAllAssignmentsAction
  console.log(`[ProgressDataFetcher] Loaded ${assignmentsResult.data.length} assignments and ${totalVideos} videos`)
  
  return (
    <ProgressClient 
      userId={userId}
      assignments={assignmentsResult.data as any}
      totalVideos={totalVideos}
    />
  )
}

function ProgressSkeleton() {
  return (
    <div className="space-y-12">
      {/* Progress Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/40 p-8">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4"></div>
              <div className="h-12 bg-muted rounded w-20 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32 mb-6"></div>
              <div className="h-3 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Skeleton */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-10">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="h-8 bg-primary/20 rounded w-48 mb-2"></div>
              <div className="h-4 bg-primary/10 rounded w-64"></div>
            </div>
            <div className="h-10 bg-primary/20 rounded-2xl w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="h-4 bg-muted rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="h-4 bg-muted rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  )
} 