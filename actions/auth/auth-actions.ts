"use server"

import { ActionState } from "@/types"

// Placeholder auth actions - will be implemented in Phase 2
export async function signInWithGoogleAction(): Promise<ActionState<{ userId: string }>> {
  console.log("[AuthActions] Sign in with Google - placeholder")
  return {
    isSuccess: false,
    message: "Google sign-in will be implemented in Phase 2"
  }
}

export async function signOutAction(): Promise<ActionState<undefined>> {
  console.log("[AuthActions] Sign out - placeholder")
  return {
    isSuccess: false,
    message: "Sign out will be implemented in Phase 2"
  }
} 