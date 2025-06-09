"use server"

import { ActionState } from "@/types"

// Placeholder video actions - will be implemented in Phase 3
export async function importChannelVideosAction(): Promise<ActionState<{ count: number }>> {
  console.log("[VideoActions] Import channel videos - placeholder")
  return {
    isSuccess: false,
    message: "Video import will be implemented in Phase 3"
  }
}

export async function getVideosAction(): Promise<ActionState<any[]>> {
  console.log("[VideoActions] Get videos - placeholder")
  return {
    isSuccess: true,
    message: "Videos retrieved",
    data: []
  }
} 