import { db, collections } from "../db/db"
import { FieldValue } from 'firebase-admin/firestore'

async function addVideoUrls() {
  console.log("Adding video URLs to all videos...")
  
  if (!db) {
    console.error("Database not initialized")
    return
  }
  
  try {
    // Get all videos without videoUrl field
    const videosSnapshot = await db.collection(collections.videos).get()
    
    let updated = 0
    let skipped = 0
    
    console.log(`Found ${videosSnapshot.size} videos to check`)
    
    for (const doc of videosSnapshot.docs) {
      const data = doc.data()
      const videoId = doc.id
      
      // Check if videoUrl already exists
      if (data.videoUrl) {
        skipped++
        continue
      }
      
      // Add video URL
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      
      console.log(`Adding URL for: ${data.title?.substring(0, 50)}...`)
      console.log(`  URL: ${videoUrl}`)
      
      await db.collection(collections.videos).doc(videoId).update({
        videoUrl: videoUrl,
        lastUpdatedAt: FieldValue.serverTimestamp()
      })
      
      updated++
    }
    
    console.log(`\n=== URL Addition Complete ===`)
    console.log(`Updated: ${updated} videos`)
    console.log(`Skipped: ${skipped} videos (already had URLs)`)
    
  } catch (error) {
    console.error("Error adding URLs:", error)
  }
  
  process.exit(0)
}

addVideoUrls().catch(console.error) 