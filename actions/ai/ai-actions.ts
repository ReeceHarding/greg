"use server"

import { ActionState } from "@/types"

// Placeholder AI actions - will be implemented in Phase 4
export async function sendChatMessageAction(message: string): Promise<ActionState<{ response: string }>> {
  console.log("[AIActions] Send chat message - placeholder")
  return {
    isSuccess: false,
    message: "AI chat will be implemented in Phase 4"
  }
}

export async function generateFeedbackAction(submissionId: string): Promise<ActionState<{ feedback: string }>> {
  console.log("[AIActions] Generate feedback - placeholder")
  return {
    isSuccess: false,
    message: "AI feedback will be implemented in Phase 4"
  }
} 