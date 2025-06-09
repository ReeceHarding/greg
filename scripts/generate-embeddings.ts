import { db, collections } from "../db/db"
import { FirebaseVideo, TranscriptChunk } from "../types/firebase-types"
import { storeTranscriptChunksAction } from "../actions/ai/pinecone-actions"
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configuration
const BATCH_SIZE = 10 // Process 10 videos at a time
const CHUNK_SIZE = 1000 // Characters per chunk
const CHUNK_OVERLAP = 200 // Overlap between chunks

console.log("[Embeddings Generator] Starting embedding generation for all videos...")
console.log("[Embeddings Generator] Pinecone Index:", process.env.PINECONE_INDEX_NAME)

// Function to chunk transcript text
function chunkTranscript(transcript: string, transcriptChunks: any[] = []): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = []
  
  // If we have transcript chunks with timestamps, use them
  if (transcriptChunks && transcriptChunks.length > 0) {
    console.log(`[Embeddings Generator] Using ${transcriptChunks.length} existing chunks with timestamps`)
    
    // Group chunks to reach approximately CHUNK_SIZE
    let currentChunk = {
      text: "",
      startTime: 0,
      endTime: 0
    }
    
    for (const chunk of transcriptChunks) {
      if (currentChunk.text.length + chunk.text.length > CHUNK_SIZE && currentChunk.text.length > 0) {
        // Save current chunk
        chunks.push({
          chunkId: `chunk_${chunks.length}`,
          text: currentChunk.text.trim(),
          startTime: currentChunk.startTime,
          endTime: currentChunk.endTime
        })
        
        // Start new chunk with overlap
        const overlapText = currentChunk.text.slice(-CHUNK_OVERLAP)
        currentChunk = {
          text: overlapText + " " + chunk.text,
          startTime: chunk.startTime || 0,
          endTime: chunk.endTime || chunk.startTime || 0
        }
      } else {
        // Add to current chunk
        if (currentChunk.text.length === 0) {
          currentChunk.startTime = chunk.startTime || 0
        }
        currentChunk.text += " " + chunk.text
        currentChunk.endTime = chunk.endTime || chunk.startTime || 0
      }
    }
    
    // Add final chunk
    if (currentChunk.text.trim().length > 0) {
      chunks.push({
        chunkId: `chunk_${chunks.length}`,
        text: currentChunk.text.trim(),
        startTime: currentChunk.startTime,
        endTime: currentChunk.endTime
      })
    }
  } else {
    // Fallback: chunk by character count without timestamps
    console.log("[Embeddings Generator] No timestamp chunks available, using character-based chunking")
    
    for (let i = 0; i < transcript.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      const chunk = transcript.slice(i, i + CHUNK_SIZE)
      if (chunk.trim().length > 0) {
        chunks.push({
          chunkId: `chunk_${chunks.length}`,
          text: chunk.trim(),
          startTime: 0,
          endTime: 0
        })
      }
    }
  }
  
  return chunks
}

async function generateEmbeddings() {
  if (!db) {
    console.error("[Embeddings Generator] Database not initialized")
    return
  }

  try {
    // Get all videos
    console.log("[Embeddings Generator] Fetching all videos from database...")
    const videosSnapshot = await db.collection(collections.videos).get()
    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseVideo & { id: string }))
    
    console.log(`[Embeddings Generator] Found ${videos.length} videos`)
    
    // Filter videos with transcripts
    const videosWithTranscripts = videos.filter(video => video.transcript && video.transcript.length > 0)
    console.log(`[Embeddings Generator] ${videosWithTranscripts.length} videos have transcripts`)
    
    // Process in batches
    let processed = 0
    let skipped = 0
    let errors = 0
    
    for (let i = 0; i < videosWithTranscripts.length; i += BATCH_SIZE) {
      const batch = videosWithTranscripts.slice(i, i + BATCH_SIZE)
      console.log(`\n[Embeddings Generator] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(videosWithTranscripts.length / BATCH_SIZE)}`)
      
      // Process each video in the batch
      await Promise.all(batch.map(async (video) => {
        try {
          console.log(`[Embeddings Generator] Processing video: ${video.title} (${video.id})`)
          
          // Check if embeddings already exist (optional - you might want to regenerate)
          // For now, we'll regenerate all embeddings
          
          // Chunk the transcript
          const chunks = chunkTranscript(video.transcript!, video.transcriptChunks)
          console.log(`[Embeddings Generator] Created ${chunks.length} chunks for video: ${video.id}`)
          
          if (chunks.length === 0) {
            console.warn(`[Embeddings Generator] No chunks created for video: ${video.id}`)
            skipped++
            return
          }
          
          // Store chunks with embeddings in Pinecone
          const result = await storeTranscriptChunksAction(video.id, chunks)
          
          if (result.isSuccess) {
            console.log(`[Embeddings Generator] ✓ Stored ${result.data?.stored} embeddings for video: ${video.id}`)
            processed++
          } else {
            console.error(`[Embeddings Generator] ✗ Failed to store embeddings for video ${video.id}:`, result.message)
            errors++
          }
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`[Embeddings Generator] Error processing video ${video.id}:`, error)
          errors++
        }
      }))
      
      console.log(`[Embeddings Generator] Batch complete. Progress: ${processed}/${videosWithTranscripts.length} processed, ${skipped} skipped, ${errors} errors`)
    }
    
    console.log("\n[Embeddings Generator] ========== SUMMARY ==========")
    console.log(`[Embeddings Generator] Total videos: ${videos.length}`)
    console.log(`[Embeddings Generator] Videos with transcripts: ${videosWithTranscripts.length}`)
    console.log(`[Embeddings Generator] Successfully processed: ${processed}`)
    console.log(`[Embeddings Generator] Skipped: ${skipped}`)
    console.log(`[Embeddings Generator] Errors: ${errors}`)
    console.log("[Embeddings Generator] ============================")
    
  } catch (error) {
    console.error("[Embeddings Generator] Fatal error:", error)
  }

  // Exit the process
  process.exit(0)
}

// Run the script
generateEmbeddings() 