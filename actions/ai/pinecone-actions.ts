"use server"

import { Pinecone, QueryResponse } from '@pinecone-database/pinecone'
import { ActionState } from "@/types"
import { TranscriptChunk } from "@/types/firebase-types"
import { db, collections } from "@/db/db"

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    console.log("[Pinecone Actions] Initializing Pinecone client")
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    })
  }
  return pineconeClient
}

// Generate embeddings using Claude
async function generateEmbedding(text: string): Promise<number[]> {
  console.log("[Pinecone Actions] Generating embedding for text:", text.substring(0, 50) + "...")
  
  try {
    // Use Claude to generate a semantic representation, then convert to vector
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{
          role: "user",
          content: `Generate a semantic embedding vector for the following text. Output exactly ${process.env.PINECONE_DIMENSION} comma-separated floating point numbers between -1 and 1 that represent the semantic meaning of this text. Do not include any other text, just the numbers.

Text: "${text}"`
        }],
        max_tokens: 8192,
        temperature: 0.1
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error("[Pinecone Actions] Claude API error:", error)
      
      // Fallback to simple hash-based embedding
      return generateSimpleEmbedding(text)
    }
    
    const data = await response.json()
    const embeddingText = data.content[0].text.trim()
    const embedding = embeddingText.split(',').map((n: string) => parseFloat(n.trim()))
    
    // Validate embedding
    if (embedding.length !== parseInt(process.env.PINECONE_DIMENSION || '1536')) {
      console.warn("[Pinecone Actions] Invalid embedding dimension, using fallback")
      return generateSimpleEmbedding(text)
    }
    
    return embedding
  } catch (error) {
    console.error("[Pinecone Actions] Error generating embedding:", error)
    // Fallback to simple embedding
    return generateSimpleEmbedding(text)
  }
}

// Simple deterministic embedding fallback
function generateSimpleEmbedding(text: string): number[] {
  const dimension = parseInt(process.env.PINECONE_DIMENSION || '1536')
  const embedding = new Array(dimension).fill(0)
  
  // Simple hash-based embedding
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const index = (charCode * (i + 1)) % dimension
    embedding[index] = (embedding[index] + charCode / 255 - 0.5) / 2
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] = embedding[i] / magnitude
    }
  }
  
  return embedding
}

// Store transcript chunks with embeddings
export async function storeTranscriptChunksAction(
  videoId: string,
  chunks: TranscriptChunk[]
): Promise<ActionState<{ stored: number }>> {
  console.log(`[Pinecone Actions] Storing ${chunks.length} chunks for video: ${videoId}`)
  
  try {
    const pc = getPineconeClient()
    const index = pc.index(process.env.PINECONE_INDEX_NAME!)
    
    // Process in batches to avoid rate limits
    const batchSize = 10
    let stored = 0
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      
      // Generate embeddings for each chunk
      const vectors = await Promise.all(batch.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk.text)
        
        return {
          id: `${videoId}_${chunk.chunkId}`,
          values: embedding,
          metadata: {
            videoId,
            chunkId: chunk.chunkId,
            text: chunk.text,
            startTime: chunk.startTime,
            endTime: chunk.endTime
          }
        }
      }))
      
      // Upsert vectors to Pinecone
      await index.upsert(vectors)
      stored += vectors.length
      
      console.log(`[Pinecone Actions] Stored batch ${Math.floor(i / batchSize) + 1}, total: ${stored}`)
    }
    
    console.log(`[Pinecone Actions] Successfully stored ${stored} vectors`)
    
    return {
      isSuccess: true,
      message: "Transcript chunks stored successfully",
      data: { stored }
    }
  } catch (error) {
    console.error("[Pinecone Actions] Error storing chunks:", error)
    return { isSuccess: false, message: "Failed to store transcript chunks" }
  }
}

// Search for relevant transcript chunks
export async function searchTranscriptChunksAction(
  query: string,
  videoId?: string,
  limit: number = 5
): Promise<ActionState<TranscriptChunk[]>> {
  console.log(`[Pinecone Actions] Searching for: "${query}"`)
  if (videoId) {
    console.log(`[Pinecone Actions] Filtering by video: ${videoId}`)
  }
  
  try {
    const pc = getPineconeClient()
    const index = pc.index(process.env.PINECONE_INDEX_NAME!)
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query)
    
    // Build filter
    const filter = videoId ? { videoId } : undefined
    
    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: limit,
      filter,
      includeMetadata: true
    })
    
    // Convert results to TranscriptChunk format
    const chunks: TranscriptChunk[] = queryResponse.matches.map((match: any) => ({
      chunkId: match.metadata?.chunkId as string,
      text: match.metadata?.text as string,
      startTime: match.metadata?.startTime as number,
      endTime: match.metadata?.endTime as number
    }))
    
    console.log(`[Pinecone Actions] Found ${chunks.length} relevant chunks`)
    
    return {
      isSuccess: true,
      message: "Search completed successfully",
      data: chunks
    }
  } catch (error) {
    console.error("[Pinecone Actions] Error searching chunks:", error)
    
    // Fallback to database search if Pinecone fails
    if (videoId && db) {
      console.log("[Pinecone Actions] Falling back to database search")
      try {
        const videoDoc = await db.collection(collections.videos).doc(videoId).get()
        if (videoDoc.exists) {
          const videoData = videoDoc.data()
          if (videoData?.transcriptChunks && videoData.transcriptChunks.length > 0) {
            // Simple text search in chunks
            const relevantChunks = videoData.transcriptChunks
              .filter((chunk: TranscriptChunk) => 
                chunk.text.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, limit)
            
            return {
              isSuccess: true,
              message: "Search completed using database fallback",
              data: relevantChunks
            }
          }
        }
      } catch (dbError) {
        console.error("[Pinecone Actions] Database fallback failed:", dbError)
      }
    }
    
    return { isSuccess: false, message: "Failed to search transcript chunks" }
  }
}

// Delete vectors for a video
export async function deleteVideoVectorsAction(
  videoId: string
): Promise<ActionState<undefined>> {
  console.log(`[Pinecone Actions] Deleting vectors for video: ${videoId}`)
  
  try {
    const pc = getPineconeClient()
    const index = pc.index(process.env.PINECONE_INDEX_NAME!)
    
    // Delete all vectors with this videoId
    await index.deleteMany({
      videoId
    })
    
    console.log(`[Pinecone Actions] Successfully deleted vectors for video: ${videoId}`)
    
    return {
      isSuccess: true,
      message: "Vectors deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Pinecone Actions] Error deleting vectors:", error)
    return { isSuccess: false, message: "Failed to delete vectors" }
  }
} 