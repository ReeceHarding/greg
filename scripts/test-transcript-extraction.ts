import { extractVideoTranscriptAction } from "../actions/videos/extract-transcripts"

async function testTranscriptExtraction() {
  console.log("Testing transcript extraction...")
  
  // Test with the video ID from the user's example
  const videoId = "lf8Pa0U9oiY"
  
  console.log(`Extracting transcript for video: ${videoId}`)
  const result = await extractVideoTranscriptAction(videoId)
  
  console.log("Result:", result)
  
  if (result.isSuccess) {
    console.log("Transcript extraction completed!")
    console.log("Has transcript:", result.data?.hasTranscript)
  } else {
    console.error("Failed:", result.message)
  }
  
  process.exit(0)
}

testTranscriptExtraction().catch(console.error) 