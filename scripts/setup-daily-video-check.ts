// Daily Video Check Setup Script
// This script demonstrates how to set up automatic daily checks for new videos
// You can run this using Vercel Cron Jobs or a Cloud Function

import { checkForNewVideosAction } from "../actions/videos/import-channel-videos"

export async function dailyVideoCheck() {
  console.log("[Daily Video Check] Starting check for new videos...")
  console.log(`[Daily Video Check] Time: ${new Date().toISOString()}`)
  
  try {
    const result = await checkForNewVideosAction()
    
    if (result.isSuccess) {
      console.log("[Daily Video Check] Check completed successfully")
      console.log(`[Daily Video Check] Found ${result.data?.newVideos || 0} new videos`)
      
      if (result.data && result.data.newVideos > 0) {
        console.log(`[Daily Video Check] ${result.data.newVideos} new videos have been imported`)
      }
    } else {
      console.error("[Daily Video Check] Check failed:", result.message)
    }
  } catch (error) {
    console.error("[Daily Video Check] Error during check:", error)
  }
  
  console.log("[Daily Video Check] Check completed")
}

// For Vercel Cron Jobs, create an API route:
// app/api/cron/check-videos/route.ts
/*
export async function GET() {
  await dailyVideoCheck()
  return Response.json({ success: true })
}
*/

// Add to vercel.json:
/*
{
  "crons": [
    {
      "path": "/api/cron/check-videos",
      "schedule": "0 0 * * *"  // Daily at midnight UTC
    }
  ]
}
*/

// For testing, you can run this script directly:
if (require.main === module) {
  dailyVideoCheck()
    .then(() => {
      console.log("[Daily Video Check] Script finished")
      process.exit(0)
    })
    .catch((error) => {
      console.error("[Daily Video Check] Script error:", error)
      process.exit(1)
    })
} 