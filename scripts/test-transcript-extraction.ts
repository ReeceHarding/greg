import { extractVideoTranscriptAction } from "../actions/videos/extract-transcripts"

async function testTranscriptExtraction() {
  console.log("Testing transcript extraction...")
  
  // Test with multiple video IDs
  const videoIds = [
    "lf8Pa0U9oiY", // Original video
    "dQw4w9WgXcQ", // Rick Astley - known to have captions
    "odGG6oxNfYQ", // Another video from the database
  ]
  
  for (const videoId of videoIds) {
    console.log(`\n=== Testing video: ${videoId} ===`)
    console.log(`Extracting transcript for video: ${videoId}`)
    
    const result = await extractVideoTranscriptAction(videoId)
    
    console.log("Result:", result)
    
    if (result.isSuccess) {
      console.log("Transcript extraction completed!")
      console.log("Has transcript:", result.data?.hasTranscript)
      
      // If we successfully extracted a transcript, break the loop
      if (result.data?.hasTranscript) {
        console.log("✅ Successfully extracted transcript!")
        break
      }
    } else {
      console.error("Failed:", result.message)
    }
  }
  
  process.exit(0)
}

testTranscriptExtraction().catch(console.error) 