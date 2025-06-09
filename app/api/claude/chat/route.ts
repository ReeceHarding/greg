import { NextRequest, NextResponse } from "next/server"

// Placeholder Claude chat API - will be implemented in Phase 4
export async function POST(request: NextRequest) {
  console.log("[Claude Chat API] Request received")
  
  try {
    const body = await request.json()
    const { message, videoId } = body
    
    console.log("[Claude Chat API] Message:", message)
    console.log("[Claude Chat API] Video context:", videoId)
    
    return NextResponse.json({
      success: false,
      message: "AI chat will be implemented in Phase 4"
    }, { status: 501 })
  } catch (error) {
    console.error("[Claude Chat API] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Invalid request"
    }, { status: 400 })
  }
} 