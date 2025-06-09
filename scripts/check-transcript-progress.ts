import { db, collections } from "../db/db"

async function checkProgress() {
  console.log("Checking transcript extraction progress...")
  console.log("Time:", new Date().toLocaleString())
  console.log("=====================================")
  
  if (!db) {
    console.error("Database not initialized")
    return
  }
  
  // Get total videos
  const totalSnapshot = await db.collection(collections.videos).get()
  const totalVideos = totalSnapshot.size
  
  // Get videos with transcripts
  const withTranscriptsSnapshot = await db.collection(collections.videos)
    .where('transcript', '!=', '')
    .get()
  const videosWithTranscripts = withTranscriptsSnapshot.size
  
  // Get videos without transcripts
  const withoutTranscripts = totalVideos - videosWithTranscripts
  
  // Calculate percentage
  const percentage = totalVideos > 0 
    ? ((videosWithTranscripts / totalVideos) * 100).toFixed(2)
    : "0"
  
  console.log(`Total videos: ${totalVideos}`)
  console.log(`Videos with transcripts: ${videosWithTranscripts}`)
  console.log(`Videos without transcripts: ${withoutTranscripts}`)
  console.log(`Progress: ${percentage}%`)
  
  // Show progress bar
  const barLength = 40
  const filled = Math.round((videosWithTranscripts / totalVideos) * barLength)
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
  console.log(`\n[${bar}] ${percentage}%`)
  
  // Estimate time remaining
  if (withoutTranscripts > 0) {
    const estimatedSeconds = withoutTranscripts * 1.5 // 1 second per video + overhead
    const hours = Math.floor(estimatedSeconds / 3600)
    const minutes = Math.floor((estimatedSeconds % 3600) / 60)
    console.log(`\nEstimated time remaining: ${hours}h ${minutes}m`)
  } else {
    console.log("\n✅ All transcripts extracted!")
  }
  
  // Show recent successes
  console.log("\n=====================================")
  console.log("Recently processed videos:")
  
  try {
    // Simple query without ordering to avoid index issues
    const recentVideos = await db.collection(collections.videos)
      .where('transcript', '!=', '')
      .limit(5)
      .get()
    
    recentVideos.forEach(doc => {
      const data = doc.data()
      const transcriptLength = data.transcript?.length || 0
      const chunksCount = data.transcriptChunks?.length || 0
      console.log(`\n- ${data.title}`)
      console.log(`  Transcript: ${transcriptLength} chars in ${chunksCount} chunks`)
    })
  } catch (error) {
    console.log("(Unable to show recent videos due to query limitations)")
  }
}

checkProgress().then(() => {
  console.log("\n=====================================")
  console.log("Check complete")
  process.exit(0)
}).catch(console.error) 