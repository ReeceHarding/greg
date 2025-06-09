import { importChannelVideosAction } from "@/actions/videos/import-channel-videos"

async function testImport() {
  console.log("Testing YouTube import...")
  console.log("Environment check:")
  console.log("- YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY)
  console.log("- YOUTUBE_API_KEY length:", process.env.YOUTUBE_API_KEY?.length || 0)
  
  try {
    const result = await importChannelVideosAction()
    console.log("Import result:", result)
  } catch (error) {
    console.error("Import error:", error)
  }
}

testImport() 