"use server"

import { ActionState } from "@/types"
import { db, collections } from "@/db/db"
import { FirebaseVideo, SerializedFirebaseVideo } from "@/types/firebase-types"

// Note: In "use server" files, only async functions can be exported directly.
// Import these functions directly from their source files when needed:
// - importChannelVideosAction, checkForNewVideosAction from "./import-channel-videos"
// - extractVideoTranscriptAction, extractAllMissingTranscriptsAction, updateVideoTranscriptAction from "./extract-transcripts"

// Get all videos from the database
export async function getVideosAction(): Promise<ActionState<SerializedFirebaseVideo[]>> {
  try {
    if (!db) {
      console.error("[VideoActions] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log("[VideoActions] Fetching videos from database")
    
    const videosSnapshot = await db.collection(collections.videos)
      .orderBy('publishedAt', 'desc')
      .get()
    
    const videos = videosSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        videoId: doc.id,
        // Convert Firestore Timestamps to serializable dates
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt,
        importedAt: data.importedAt?.toDate ? data.importedAt.toDate() : data.importedAt,
        lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : data.lastUpdatedAt,
        // Convert any timestamps in transcript chunks as well
        transcriptChunks: data.transcriptChunks?.map((chunk: any) => ({
          ...chunk,
          timestamp: chunk.timestamp?.toDate ? chunk.timestamp.toDate() : chunk.timestamp
        })) || []
      } as any
    })
    
    console.log(`[VideoActions] Retrieved ${videos.length} videos`)
    
    return {
      isSuccess: true,
      message: "Videos retrieved successfully",
      data: videos
    }
  } catch (error) {
    console.error("[VideoActions] Error fetching videos:", error)
    return { isSuccess: false, message: "Failed to fetch videos" }
  }
}

// Get a single video by ID
export async function getVideoByIdAction(videoId: string): Promise<ActionState<SerializedFirebaseVideo>> {
  try {
    if (!db) {
      console.error("[VideoActions] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log(`[VideoActions] Fetching video: ${videoId}`)
    
    const videoDoc = await db.collection(collections.videos).doc(videoId).get()
    
    if (!videoDoc.exists) {
      console.error(`[VideoActions] Video not found: ${videoId}`)
      return { isSuccess: false, message: "Video not found" }
    }
    
    const data = videoDoc.data()!
    const video = {
      ...data,
      videoId: videoDoc.id,
      // Convert Firestore Timestamps to serializable dates
      publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt,
      importedAt: data.importedAt?.toDate ? data.importedAt.toDate() : data.importedAt,
      lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : data.lastUpdatedAt,
      // Convert any timestamps in transcript chunks as well
      transcriptChunks: data.transcriptChunks?.map((chunk: any) => ({
        ...chunk,
        timestamp: chunk.timestamp?.toDate ? chunk.timestamp.toDate() : chunk.timestamp
      })) || []
    } as any
    
    console.log(`[VideoActions] Retrieved video: ${video.title}`)
    
    return {
      isSuccess: true,
      message: "Video retrieved successfully",
      data: video
    }
  } catch (error) {
    console.error(`[VideoActions] Error fetching video ${videoId}:`, error)
    return { isSuccess: false, message: "Failed to fetch video" }
  }
}

// Search videos by title or description
export async function searchVideosAction(query: string): Promise<ActionState<SerializedFirebaseVideo[]>> {
  try {
    if (!db) {
      console.error("[VideoActions] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log(`[VideoActions] Searching videos with query: ${query}`)
    
    // For now, we'll fetch all videos and filter client-side
    // In production, you'd want to use a proper search service like Algolia or Elasticsearch
    const videosSnapshot = await db.collection(collections.videos)
      .orderBy('publishedAt', 'desc')
      .get()
    
    const allVideos = videosSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        videoId: doc.id,
        // Convert Firestore Timestamps to serializable dates
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt,
        importedAt: data.importedAt?.toDate ? data.importedAt.toDate() : data.importedAt,
        lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : data.lastUpdatedAt,
        // Convert any timestamps in transcript chunks as well
        transcriptChunks: data.transcriptChunks?.map((chunk: any) => ({
          ...chunk,
          timestamp: chunk.timestamp?.toDate ? chunk.timestamp.toDate() : chunk.timestamp
        })) || []
      } as any
    })
    
    // Simple text search
    const searchQuery = query.toLowerCase()
    const filteredVideos = allVideos.filter(video => 
      video.title.toLowerCase().includes(searchQuery) ||
      video.description.toLowerCase().includes(searchQuery) ||
      video.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery))
    )
    
    console.log(`[VideoActions] Found ${filteredVideos.length} videos matching query`)
    
    return {
      isSuccess: true,
      message: `Found ${filteredVideos.length} videos`,
      data: filteredVideos
    }
  } catch (error) {
    console.error("[VideoActions] Error searching videos:", error)
    return { isSuccess: false, message: "Failed to search videos" }
  }
} 