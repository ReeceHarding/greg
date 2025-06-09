import { NextRequest, NextResponse } from "next/server"
import { importChannelVideosAction } from "@/actions/videos/import-channel-videos"

export async function POST(request: NextRequest) {
  console.log("[YouTube Import API] Import request received")
  
  try {
    const body = await request.json()
    console.log("[YouTube Import API] Request body:", body)
    
    // Run the import action
    const result = await importChannelVideosAction()
    
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
    console.error("[YouTube Import API] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Import failed"
    }, { status: 500 })
  }
} 