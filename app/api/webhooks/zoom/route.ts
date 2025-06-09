import { NextRequest, NextResponse } from "next/server"

// Placeholder Zoom webhook - will be implemented in Phase 3
export async function POST(request: NextRequest) {
  console.log("[Zoom Webhook API] Notification received")
  
  try {
    const body = await request.json()
    console.log("[Zoom Webhook API] Event type:", body.event)
    
    return NextResponse.json({
      success: false,
      message: "Zoom integration will be implemented in Phase 3"
    }, { status: 501 })
  } catch (error) {
    console.error("[Zoom Webhook API] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Invalid request"
    }, { status: 400 })
  }
} 