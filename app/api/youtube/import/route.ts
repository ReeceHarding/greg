import { NextRequest, NextResponse } from "next/server"

// Placeholder YouTube import webhook - will be implemented in Phase 3
export async function POST(request: NextRequest) {
  console.log("[YouTube Import API] Webhook received")
  
  try {
    const body = await request.json()
    console.log("[YouTube Import API] Request body:", body)
    
    return NextResponse.json({
      success: false,
      message: "YouTube import will be implemented in Phase 3"
    }, { status: 501 })
  } catch (error) {
    console.error("[YouTube Import API] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Invalid request"
    }, { status: 400 })
  }
} 