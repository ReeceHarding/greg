import { NextRequest, NextResponse } from "next/server"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }
  
  const profileResult = await getProfileByUserIdAction(userId)
  
  if (!profileResult.isSuccess || !profileResult.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }
  
  return NextResponse.json({
    displayName: profileResult.data.displayName,
    photoURL: profileResult.data.photoURL,
    email: profileResult.data.email
  })
} 