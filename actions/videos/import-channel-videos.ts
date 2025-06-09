"use server"

import { db, collections } from "@/db/db"
import { FirebaseVideo } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_URL = "https://www.youtube.com/@GregIsenberg"
const API_BASE_URL = "https://www.googleapis.com/youtube/v3"

// Greg Isenberg's channel ID (from YouTube API)
const GREG_CHANNEL_ID = "UCPjNBjflYl0-HQtUvOx0Ibw"

// Extract channel handle from URL
const CHANNEL_HANDLE = "GregIsenberg"

// Get channel ID from channel handle
async function getChannelId(channelHandle: string): Promise<string | null> {
  try {
    console.log("[YouTube Import] Getting channel ID for handle:", channelHandle)
    
    const response = await fetch(
      `${API_BASE_URL}/channels?part=contentDetails&forUsername=${channelHandle}&key=${YOUTUBE_API_KEY}`
    )
    
    // If username doesn't work, try searching by handle
    if (!response.ok) {
      console.log("[YouTube Import] Username search failed, trying search endpoint")
      const searchResponse = await fetch(
        `${API_BASE_URL}/search?part=snippet&q=${channelHandle}&type=channel&key=${YOUTUBE_API_KEY}`
      )
      
      if (!searchResponse.ok) {
        console.error("[YouTube Import] Search request failed:", searchResponse.status)
        return null
      }
      
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        // Find exact match for the channel
        const exactMatch = searchData.items.find((item: any) => 
          item.snippet.title === "Greg Isenberg" || 
          item.snippet.channelTitle === "Greg Isenberg"
        )
        
        if (exactMatch) {
          console.log("[YouTube Import] Found channel ID via search:", exactMatch.snippet.channelId)
          return exactMatch.snippet.channelId
        }
        
        // If no exact match, use first result
        console.log("[YouTube Import] Using first search result:", searchData.items[0].snippet.channelId)
        return searchData.items[0].snippet.channelId
      }
    }
    
    const data = await response.json()
    if (data.items && data.items.length > 0) {
      console.log("[YouTube Import] Found channel ID:", data.items[0].id)
      return data.items[0].id
    }
    
    console.error("[YouTube Import] No channel found for handle:", channelHandle)
    return null
  } catch (error) {
    console.error("[YouTube Import] Error getting channel ID:", error)
    return null
  }
}

// Get uploads playlist ID for a channel
async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  try {
    console.log("[YouTube Import] Getting uploads playlist for channel:", channelId)
    
    const response = await fetch(
      `${API_BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      console.error("[YouTube Import] Failed to get channel details:", response.status)
      return null
    }
    
    const data = await response.json()
    if (data.items && data.items.length > 0) {
      const playlistId = data.items[0].contentDetails.relatedPlaylists.uploads
      console.log("[YouTube Import] Found uploads playlist:", playlistId)
      return playlistId
    }
    
    console.error("[YouTube Import] No uploads playlist found")
    return null
  } catch (error) {
    console.error("[YouTube Import] Error getting uploads playlist:", error)
    return null
  }
}

// Fetch all videos from a playlist with pagination
async function fetchAllVideosFromPlaylist(playlistId: string): Promise<any[]> {
  const videos: any[] = []
  let nextPageToken: string | undefined = undefined
  let pageCount = 0
  
  console.log("[YouTube Import] Starting to fetch videos from playlist:", playlistId)
  
  do {
    try {
      pageCount++
      console.log(`[YouTube Import] Fetching page ${pageCount}...`)
      
      const params = new URLSearchParams({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: '50', // Maximum allowed
        key: YOUTUBE_API_KEY!,
      })
      
      if (nextPageToken) {
        params.append('pageToken', nextPageToken)
      }
      
      const response = await fetch(`${API_BASE_URL}/playlistItems?${params}`)
      
      if (!response.ok) {
        console.error("[YouTube Import] Failed to fetch playlist items:", response.status)
        break
      }
      
      const data = await response.json()
      
      if (data.items) {
        videos.push(...data.items)
        console.log(`[YouTube Import] Fetched ${data.items.length} videos (total: ${videos.length})`)
      }
      
      nextPageToken = data.nextPageToken
      
    } catch (error) {
      console.error("[YouTube Import] Error fetching playlist page:", error)
      break
    }
  } while (nextPageToken)
  
  console.log(`[YouTube Import] Finished fetching. Total videos: ${videos.length}`)
  return videos
}

// Fetch detailed video information including duration
async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, any>> {
  const detailsMap = new Map<string, any>()
  
  // YouTube API allows up to 50 IDs per request
  const chunks = []
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50))
  }
  
  console.log(`[YouTube Import] Fetching details for ${videoIds.length} videos in ${chunks.length} chunks`)
  
  for (const chunk of chunks) {
    try {
      const params = new URLSearchParams({
        part: 'contentDetails,statistics',
        id: chunk.join(','),
        key: YOUTUBE_API_KEY!,
      })
      
      const response = await fetch(`${API_BASE_URL}/videos?${params}`)
      
      if (!response.ok) {
        console.error("[YouTube Import] Failed to fetch video details:", response.status)
        continue
      }
      
      const data = await response.json()
      
      if (data.items) {
        for (const item of data.items) {
          detailsMap.set(item.id, {
            duration: parseDuration(item.contentDetails.duration),
            viewCount: parseInt(item.statistics.viewCount || '0'),
          })
        }
      }
    } catch (error) {
      console.error("[YouTube Import] Error fetching video details chunk:", error)
    }
  }
  
  console.log(`[YouTube Import] Successfully fetched details for ${detailsMap.size} videos`)
  return detailsMap
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  if (!duration) return 0
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  
  if (!match) {
    console.warn(`[YouTube Import] Could not parse duration: ${duration}`)
    return 0
  }
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

// Main import function
export async function importChannelVideosAction(): Promise<ActionState<{ imported: number; updated: number }>> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error("[YouTube Import] No YouTube API key found")
      return { isSuccess: false, message: "YouTube API key not configured" }
    }
    
    if (!db) {
      console.error("[YouTube Import] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log("[YouTube Import] Starting import process...")
    
    // Use Greg Isenberg's channel ID directly
    const channelId = GREG_CHANNEL_ID
    console.log("[YouTube Import] Using channel ID:", channelId)
    
    // Get uploads playlist
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId)
    if (!uploadsPlaylistId) {
      return { isSuccess: false, message: "Could not find uploads playlist" }
    }
    
    // Fetch all videos
    const playlistItems = await fetchAllVideosFromPlaylist(uploadsPlaylistId)
    
    if (playlistItems.length === 0) {
      return { isSuccess: false, message: "No videos found in channel" }
    }
    
    // Extract video IDs
    const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId)
    
    // Fetch detailed information
    const videoDetails = await fetchVideoDetails(videoIds)
    
    let imported = 0
    let updated = 0
    
    console.log("[YouTube Import] Processing videos...")
    
    // Process each video
    for (const item of playlistItems) {
      try {
        const videoId = item.snippet.resourceId.videoId
        const details = videoDetails.get(videoId) || { duration: 0, viewCount: 0 }
        
        // Check if video already exists
        const existingDoc = await db.collection(collections.videos).doc(videoId).get()
        
        const publishedDate = new Date(item.snippet.publishedAt)
        
        const videoData: Omit<FirebaseVideo, 'transcriptChunks' | 'transcript'> = {
          videoId: videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnailUrl: item.snippet.thumbnails?.high?.url || 
                       item.snippet.thumbnails?.medium?.url || 
                       item.snippet.thumbnails?.default?.url || '',
          duration: details.duration,
          publishedAt: publishedDate as any,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          tags: item.snippet.tags || [],
          viewCount: details.viewCount,
          importedAt: FieldValue.serverTimestamp() as any,
          lastUpdatedAt: FieldValue.serverTimestamp() as any,
        }
        
        if (existingDoc.exists) {
          // Update existing video
          const updateData = {
            title: videoData.title,
            description: videoData.description,
            thumbnailUrl: videoData.thumbnailUrl,
            duration: videoData.duration,
            publishedAt: publishedDate,
            channelId: videoData.channelId,
            channelTitle: videoData.channelTitle,
            tags: videoData.tags,
            viewCount: videoData.viewCount,
            lastUpdatedAt: FieldValue.serverTimestamp(),
          }
          await db.collection(collections.videos).doc(videoId).update(updateData)
          updated++
          console.log(`[YouTube Import] Updated video: ${item.snippet.title}`)
        } else {
          // Create new video
          const createData = {
            videoId: videoData.videoId,
            title: videoData.title,
            description: videoData.description,
            thumbnailUrl: videoData.thumbnailUrl,
            duration: videoData.duration,
            publishedAt: publishedDate,
            channelId: videoData.channelId,
            channelTitle: videoData.channelTitle,
            tags: videoData.tags,
            viewCount: videoData.viewCount,
            transcript: '', // Will be populated later
            transcriptChunks: [], // Will be populated later
            importedAt: FieldValue.serverTimestamp(),
            lastUpdatedAt: FieldValue.serverTimestamp(),
          }
          await db.collection(collections.videos).doc(videoId).set(createData)
          imported++
          console.log(`[YouTube Import] Imported video: ${item.snippet.title}`)
        }
        
      } catch (error) {
        console.error(`[YouTube Import] Error processing video ${item.snippet.title}:`, error)
      }
    }
    
    console.log(`[YouTube Import] Import complete. Imported: ${imported}, Updated: ${updated}`)
    
    return {
      isSuccess: true,
      message: `Successfully imported ${imported} new videos and updated ${updated} existing videos`,
      data: { imported, updated }
    }
    
  } catch (error) {
    console.error("[YouTube Import] Error during import:", error)
    return { isSuccess: false, message: "Failed to import videos" }
  }
}

// Function to check for new videos (for daily cron job)
export async function checkForNewVideosAction(): Promise<ActionState<{ newVideos: number }>> {
  try {
    if (!db) {
      console.error("[YouTube Import] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log("[YouTube Import] Checking for new videos...")
    
    // Get the most recent video from our database
    const recentVideosSnapshot = await db.collection(collections.videos)
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get()
    
    let lastPublishedAt: Date | null = null
    
    if (!recentVideosSnapshot.empty) {
      const lastVideo = recentVideosSnapshot.docs[0].data()
      lastPublishedAt = lastVideo.publishedAt?.toDate() || null
    }
    
    console.log("[YouTube Import] Last video published at:", lastPublishedAt)
    
    // Import all videos (the function will handle duplicates)
    const result = await importChannelVideosAction()
    
    if (result.isSuccess && result.data) {
      return {
        isSuccess: true,
        message: `Found ${result.data.imported} new videos`,
        data: { newVideos: result.data.imported }
      }
    }
    
    return { isSuccess: false, message: "Failed to check for new videos" }
    
  } catch (error) {
    console.error("[YouTube Import] Error checking for new videos:", error)
    return { isSuccess: false, message: "Failed to check for new videos" }
  }
} 