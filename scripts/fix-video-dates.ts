import { db, collections } from "../db/db"
import { FieldValue } from 'firebase-admin/firestore'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const API_BASE_URL = "https://www.googleapis.com/youtube/v3"

async function fixVideoDates() {
  console.log("Starting to fix video published dates...")
  
  if (!YOUTUBE_API_KEY) {
    console.error("No YouTube API key found")
    return
  }
  
  if (!db) {
    console.error("Database not initialized")
    return
  }
  
  try {
    // Get all videos from database
    const videosSnapshot = await db.collection(collections.videos).get()
    
    console.log(`Found ${videosSnapshot.size} videos to fix`)
    
    // Process in batches of 50 (YouTube API limit)
    const videoIds: string[] = []
    videosSnapshot.forEach(doc => {
      videoIds.push(doc.id)
    })
    
    let fixed = 0
    let errors = 0
    
    // Process in chunks of 50
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50)
      console.log(`\nProcessing batch ${Math.floor(i/50) + 1}/${Math.ceil(videoIds.length/50)}...`)
      
      try {
        // Fetch video details from YouTube API
        const params = new URLSearchParams({
          part: 'snippet',
          id: chunk.join(','),
          key: YOUTUBE_API_KEY,
        })
        
        const response = await fetch(`${API_BASE_URL}/videos?${params}`)
        
        if (!response.ok) {
          console.error(`Failed to fetch video details: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.items) {
          // Update each video with correct published date
          for (const item of data.items) {
            try {
              const videoId = item.id
              const correctPublishedDate = new Date(item.snippet.publishedAt)
              
              console.log(`Fixing ${videoId}: ${item.snippet.title.substring(0, 50)}...`)
              console.log(`  Correct date: ${correctPublishedDate.toISOString()}`)
              
              // Update the video with correct published date
              await db.collection(collections.videos).doc(videoId).update({
                publishedAt: correctPublishedDate,
                lastUpdatedAt: FieldValue.serverTimestamp()
              })
              
              fixed++
            } catch (error) {
              console.error(`Error updating video ${item.id}:`, error)
              errors++
            }
          }
        }
        
        // Add delay to avoid rate limiting
        if (i + 50 < videoIds.length) {
          console.log("Waiting 1 second before next batch...")
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`Error processing batch:`, error)
        errors += chunk.length
      }
    }
    
    console.log(`\n=== Date Fix Complete ===`)
    console.log(`Fixed: ${fixed} videos`)
    console.log(`Errors: ${errors}`)
    
    // Verify a sample
    console.log("\n=== Verifying fix (checking first video) ===")
    const testVideoId = videoIds[0]
    if (testVideoId) {
      const doc = await db.collection(collections.videos).doc(testVideoId).get()
      const data = doc.data()
      if (data) {
        const publishedDate = data.publishedAt.toDate ? data.publishedAt.toDate() : new Date(data.publishedAt)
        console.log(`Video: ${data.title?.substring(0, 50)}...`)
        console.log(`Published Date: ${publishedDate.toISOString()}`)
      }
    }
    
  } catch (error) {
    console.error("Error fixing dates:", error)
  }
  
  process.exit(0)
}

fixVideoDates().catch(console.error) 