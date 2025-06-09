import { NextRequest, NextResponse } from "next/server"
import { importChannelVideosAction } from "@/actions/videos/import-channel-videos"

export async function POST(request: NextRequest) {
  console.log("[YouTube Import API] Import request received")
  console.log("[YouTube Import API] Environment check:")
  console.log("[YouTube Import API] - YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY)
  
  try {
    const body = await request.json()
    console.log("[YouTube Import API] Request body:", body)
    
    // Run the import action
    console.log("[YouTube Import API] Calling importChannelVideosAction...")
    const result = await importChannelVideosAction()
    console.log("[YouTube Import API] Action result:", result)
    
    if (result.isSuccess) {
      console.log("[YouTube Import API] Import successful:", result.data)
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      })
    } else {
      console.error("[YouTube Import API] Import failed:", result.message)
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[YouTube Import API] Error details:", error)
    console.error("[YouTube Import API] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Import failed"
    }, { status: 500 })
  }
} 