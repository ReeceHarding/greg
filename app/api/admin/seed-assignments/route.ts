import { NextRequest, NextResponse } from "next/server"
import { seedAssignments } from "@/scripts/seed-assignments"

export async function POST(request: NextRequest) {
  console.log("[Seed Assignments API] Seed request received")
  
  try {
    // Run the seed function
    const result = await seedAssignments()
    
    console.log("[Seed Assignments API] Seed complete:", result)
    return NextResponse.json({
      success: true,
      message: "Assignments seeded successfully",
      data: result
    })
  } catch (error) {
    console.error("[Seed Assignments API] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Seed failed"
    }, { status: 500 })
  }
} 