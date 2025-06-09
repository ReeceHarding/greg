import { extractAllMissingTranscriptsAction } from "../actions/videos/extract-transcripts"

async function extractAllTranscripts() {
  console.log("Starting bulk transcript extraction...")
  console.log("This may take a while depending on the number of videos...")
  
  const result = await extractAllMissingTranscriptsAction()
  
  console.log("\n=== Extraction Complete ===")
  console.log("Result:", result)
  
  if (result.isSuccess && result.data) {
    console.log(`\nProcessed ${result.data.processed} videos`)
    console.log(`Successfully extracted ${result.data.successful} transcripts`)
    
    const failureRate = result.data.processed > 0 
      ? ((result.data.processed - result.data.successful) / result.data.processed * 100).toFixed(1)
      : 0
    
    console.log(`Failure rate: ${failureRate}%`)
  }
  
  process.exit(0)
}

extractAllTranscripts().catch(console.error) 