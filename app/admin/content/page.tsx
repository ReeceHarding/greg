"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllVideosAction } from "@/actions/videos/video-actions"
import ContentManagementClient from "./_components/content-management-client"

export default async function AdminContentPage() {
  console.log("[Admin Content Page] Checking authentication")
  
  const authResult = await auth()
  if (!authResult.user || !authResult.user.customClaims || authResult.user.customClaims.role !== "admin") {
    console.log("[Admin Content Page] Unauthorized access")
    redirect("/")
  }
  
  console.log("[Admin Content Page] Fetching all videos")
  const videosResult = await getAllVideosAction()
  
  const videos = videosResult.isSuccess ? videosResult.data : []
  console.log(`[Admin Content Page] Found ${videos.length} videos`)
  
  // Serialize videos for client component
  const serializedVideos = videos.map(video => ({
    ...video,
    publishedAt: video.publishedAt instanceof Date ? video.publishedAt.toISOString() : 
                 (video.publishedAt as any)?.toDate ? (video.publishedAt as any).toDate().toISOString() : 
                 new Date().toISOString(),
    importedAt: video.importedAt instanceof Date ? video.importedAt.toISOString() : 
                (video.importedAt as any)?.toDate ? (video.importedAt as any).toDate().toISOString() : 
                new Date().toISOString(),
    lastUpdatedAt: video.lastUpdatedAt instanceof Date ? video.lastUpdatedAt.toISOString() : 
                   (video.lastUpdatedAt as any)?.toDate ? (video.lastUpdatedAt as any).toDate().toISOString() : 
                   new Date().toISOString()
  }))
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Content Management</h1>
        <p className="text-muted-foreground">Manage videos and course materials</p>
      </div>
      
      <ContentManagementClient 
        initialVideos={serializedVideos}
      />
    </div>
  )
} 