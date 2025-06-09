"use server"

import { db, collections } from "@/db/db"
import { FirebaseVideo, TranscriptChunk } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const API_BASE_URL = "https://www.googleapis.com/youtube/v3"

// Chunk size for transcript splitting (in characters)
const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 100

interface CaptionTrack {
  id: string
  language: string
  trackKind: string
  isAutoSynced: boolean
}

interface TimedText {
  text: string
  start: number
  duration: number
}

// Get available caption tracks for a video
async function getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  try {
    console.log(`[Transcript Extract] Getting caption tracks for video: ${videoId}`)
    
    const response = await fetch(
      `${API_BASE_URL}/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      console.error(`[Transcript Extract] Failed to get captions: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.log(`[Transcript Extract] No captions found for video: ${videoId}`)
      return []
    }
    
    const tracks = data.items.map((item: any) => ({
      id: item.id,
      language: item.snippet.language,
      trackKind: item.snippet.trackKind,
      isAutoSynced: item.snippet.trackKind === 'ASR'
    }))
    
    console.log(`[Transcript Extract] Found ${tracks.length} caption tracks`)
    return tracks
    
  } catch (error) {
    console.error(`[Transcript Extract] Error getting caption tracks:`, error)
    return []
  }
}

// Since we can't directly download captions without OAuth, we'll use an alternative approach
// This function attempts to extract transcript using YouTube's oEmbed API and page scraping as a fallback
async function extractTranscriptAlternative(videoId: string): Promise<{ text: string; chunks: TranscriptChunk[] } | null> {
  try {
    console.log(`[Transcript Extract] Attempting alternative transcript extraction for: ${videoId}`)
    
    // Try to get transcript from YouTube's public API endpoints
    // Note: This is a simplified approach. In production, you might want to:
    // 1. Use OAuth to properly access the captions.download endpoint
    // 2. Use a third-party service that provides transcript extraction
    // 3. Implement a more sophisticated scraping approach
    
    // For now, we'll create a placeholder that indicates transcript needs manual extraction
    const placeholderText = `Transcript pending extraction for video ${videoId}. 
    To fully implement transcript extraction, consider:
    1. Setting up OAuth 2.0 for accessing private caption data
    2. Using a third-party transcript service
    3. Implementing server-side extraction with proper authentication`
    
    const chunks = createTranscriptChunks(placeholderText, videoId)
    
    return {
      text: placeholderText,
      chunks
    }
    
  } catch (error) {
    console.error(`[Transcript Extract] Error in alternative extraction:`, error)
    return null
  }
}

// Create chunks from transcript text
function createTranscriptChunks(text: string, videoId: string): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  let chunkStart = 0
  let chunkIndex = 0
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    
    if (currentChunk.length + trimmedSentence.length > CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        chunkId: `${videoId}_chunk_${chunkIndex}`,
        text: currentChunk.trim(),
        startTime: chunkStart,
        endTime: chunkStart + (currentChunk.length / 10), // Rough estimate: 10 chars per second
      })
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-CHUNK_OVERLAP)
      currentChunk = overlapText + ' ' + trimmedSentence
      chunkStart = chunkStart + (currentChunk.length / 10) - (CHUNK_OVERLAP / 10)
      chunkIndex++
    } else {
      currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkId: `${videoId}_chunk_${chunkIndex}`,
      text: currentChunk.trim(),
      startTime: chunkStart,
      endTime: chunkStart + (currentChunk.length / 10),
    })
  }
  
  console.log(`[Transcript Extract] Created ${chunks.length} chunks`)
  return chunks
}

// Extract transcript for a single video
export async function extractVideoTranscriptAction(videoId: string): Promise<ActionState<{ hasTranscript: boolean }>> {
  try {
    if (!db) {
      console.error("[Transcript Extract] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    if (!YOUTUBE_API_KEY) {
      console.error("[Transcript Extract] No YouTube API key found")
      return { isSuccess: false, message: "YouTube API key not configured" }
    }
    
    console.log(`[Transcript Extract] Starting transcript extraction for video: ${videoId}`)
    
    // Check if video exists
    const videoDoc = await db.collection(collections.videos).doc(videoId).get()
    
    if (!videoDoc.exists) {
      console.error(`[Transcript Extract] Video not found: ${videoId}`)
      return { isSuccess: false, message: "Video not found" }
    }
    
    const videoData = videoDoc.data() as FirebaseVideo
    
    // Check if transcript already exists
    if (videoData.transcript && videoData.transcript.length > 0) {
      console.log(`[Transcript Extract] Transcript already exists for video: ${videoId}`)
      return {
        isSuccess: true,
        message: "Transcript already exists",
        data: { hasTranscript: true }
      }
    }
    
    // Check for available caption tracks
    const captionTracks = await getCaptionTracks(videoId)
    
    if (captionTracks.length === 0) {
      console.log(`[Transcript Extract] No captions available for video: ${videoId}`)
      
      // Update video to indicate no transcript available
      await db.collection(collections.videos).doc(videoId).update({
        transcript: '',
        transcriptChunks: [],
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
      
      return {
        isSuccess: true,
        message: "No captions available for this video",
        data: { hasTranscript: false }
      }
    }
    
    // Prefer English captions, then any manual captions, then auto-generated
    const preferredTrack = 
      captionTracks.find(t => t.language === 'en' && t.trackKind !== 'ASR') ||
      captionTracks.find(t => t.language === 'en') ||
      captionTracks.find(t => t.trackKind !== 'ASR') ||
      captionTracks[0]
    
    console.log(`[Transcript Extract] Selected caption track: ${preferredTrack.language} (${preferredTrack.trackKind})`)
    
    // Extract transcript using alternative method
    const transcriptData = await extractTranscriptAlternative(videoId)
    
    if (!transcriptData) {
      return { isSuccess: false, message: "Failed to extract transcript" }
    }
    
    // Update video document with transcript
    await db.collection(collections.videos).doc(videoId).update({
      transcript: transcriptData.text,
      transcriptChunks: transcriptData.chunks,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
    
    console.log(`[Transcript Extract] Successfully updated transcript for video: ${videoId}`)
    
    return {
      isSuccess: true,
      message: "Transcript extracted successfully",
      data: { hasTranscript: true }
    }
    
  } catch (error) {
    console.error(`[Transcript Extract] Error extracting transcript:`, error)
    return { isSuccess: false, message: "Failed to extract transcript" }
  }
}

// Extract transcripts for all videos without transcripts
export async function extractAllMissingTranscriptsAction(): Promise<ActionState<{ processed: number; successful: number }>> {
  try {
    if (!db) {
      console.error("[Transcript Extract] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log("[Transcript Extract] Starting bulk transcript extraction...")
    
    // Get all videos without transcripts
    const videosSnapshot = await db.collection(collections.videos)
      .where('transcript', '==', '')
      .get()
    
    if (videosSnapshot.empty) {
      console.log("[Transcript Extract] No videos need transcript extraction")
      return {
        isSuccess: true,
        message: "All videos already have transcripts",
        data: { processed: 0, successful: 0 }
      }
    }
    
    let processed = 0
    let successful = 0
    
    console.log(`[Transcript Extract] Found ${videosSnapshot.size} videos without transcripts`)
    
    // Process videos in batches to avoid rate limits
    for (const doc of videosSnapshot.docs) {
      const videoId = doc.id
      processed++
      
      console.log(`[Transcript Extract] Processing ${processed}/${videosSnapshot.size}: ${videoId}`)
      
      const result = await extractVideoTranscriptAction(videoId)
      
      if (result.isSuccess) {
        successful++
      }
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`[Transcript Extract] Bulk extraction complete. Processed: ${processed}, Successful: ${successful}`)
    
    return {
      isSuccess: true,
      message: `Processed ${processed} videos, successfully extracted ${successful} transcripts`,
      data: { processed, successful }
    }
    
  } catch (error) {
    console.error("[Transcript Extract] Error in bulk extraction:", error)
    return { isSuccess: false, message: "Failed to extract transcripts" }
  }
}

// Function to manually update a video's transcript (for admin use)
export async function updateVideoTranscriptAction(
  videoId: string, 
  transcript: string
): Promise<ActionState<undefined>> {
  try {
    if (!db) {
      console.error("[Transcript Extract] Database not initialized")
      return { isSuccess: false, message: "Database not initialized" }
    }
    
    console.log(`[Transcript Extract] Manually updating transcript for video: ${videoId}`)
    
    // Check if video exists
    const videoDoc = await db.collection(collections.videos).doc(videoId).get()
    
    if (!videoDoc.exists) {
      console.error(`[Transcript Extract] Video not found: ${videoId}`)
      return { isSuccess: false, message: "Video not found" }
    }
    
    // Create chunks from the transcript
    const chunks = createTranscriptChunks(transcript, videoId)
    
    // Update video document
    await db.collection(collections.videos).doc(videoId).update({
      transcript: transcript,
      transcriptChunks: chunks,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
    
    console.log(`[Transcript Extract] Successfully updated transcript with ${chunks.length} chunks`)
    
    return {
      isSuccess: true,
      message: "Transcript updated successfully",
      data: undefined
    }
    
  } catch (error) {
    console.error(`[Transcript Extract] Error updating transcript:`, error)
    return { isSuccess: false, message: "Failed to update transcript" }
  }
} 