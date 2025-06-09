"use server"

import { Suspense } from "react"
import { getVideoByIdAction } from "@/actions/videos/video-actions"
import VideoDetailClient from "./_components/video-detail-client"
import VideoDetailSkeleton from "./_components/video-detail-skeleton"

interface VideoDetailPageProps {
  params: Promise<{ videoId: string }>
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = await params
  
  console.log(`[VideoDetailPage] Loading video: ${videoId}`)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<VideoDetailSkeleton />}>
        <VideoDetailFetcher videoId={videoId} />
      </Suspense>
    </div>
  )
}

async function VideoDetailFetcher({ videoId }: { videoId: string }) {
  console.log(`[VideoDetailFetcher] Fetching video data for: ${videoId}`)
  
  const { data: video, isSuccess } = await getVideoByIdAction(videoId)
  
  if (!isSuccess || !video) {
    console.error(`[VideoDetailFetcher] Failed to load video: ${videoId}`)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-2">Video Not Found</h2>
        <p className="text-muted-foreground">The video you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }
  
  console.log(`[VideoDetailFetcher] Successfully loaded video: ${video.title}`)
  
  return <VideoDetailClient video={video} />
} 