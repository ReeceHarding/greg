import { cookies } from "next/headers"
import { adminAuth } from "./firebase-config"
import { DecodedIdToken } from "firebase-admin/auth"

// Extended type to include custom claims
export interface AuthUser extends DecodedIdToken {
  role?: "admin" | "student"
}

// Helper to get current user from session cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  console.log("[Firebase Auth] Getting current user from session...")

  // Check if adminAuth is available
  if (!adminAuth) {
    console.warn(
      "[Firebase Auth] adminAuth is not available - Firebase not configured"
    )
    return null
  }

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      console.log("[Firebase Auth] No session cookie found")
      return null
    }

    console.log("[Firebase Auth] Session cookie found, verifying...")

    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    )
    console.log(
      "[Firebase Auth] Session verified successfully for user:",
      decodedClaims.uid
    )

    // Include custom claims
    const user: AuthUser = {
      ...decodedClaims,
      role: decodedClaims.role as "admin" | "student" | undefined
    }

    return user
  } catch (error) {
    console.error("[Firebase Auth] Error verifying session:", error)
    return null
  }
}

// Helper to create session cookie
export async function createSessionCookie(idToken: string): Promise<string> {
  console.log("[Firebase Auth] Creating session cookie...")

  // Check if adminAuth is available
  if (!adminAuth) {
    console.error(
      "[Firebase Auth] adminAuth is not available - Firebase not configured"
    )
    throw new Error("Firebase Admin Auth is not configured")
  }

  try {
    // Create session cookie that expires in 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn
    })

    console.log("[Firebase Auth] Session cookie created successfully")
    return sessionCookie
  } catch (error) {
    console.error("[Firebase Auth] Error creating session cookie:", error)
    throw error
  }
}

// Helper to revoke session
export async function revokeSession(userId: string): Promise<void> {
  console.log("[Firebase Auth] Revoking session for user:", userId)

  // Check if adminAuth is available
  if (!adminAuth) {
    console.error(
      "[Firebase Auth] adminAuth is not available - Firebase not configured"
    )
    throw new Error("Firebase Admin Auth is not configured")
  }

  try {
    await adminAuth.revokeRefreshTokens(userId)
    console.log("[Firebase Auth] Session revoked successfully")
  } catch (error) {
    console.error("[Firebase Auth] Error revoking session:", error)
    throw error
  }
}

// Replacement for clerk auth() function
export async function auth() {
  console.log("[Firebase Auth] Auth function called")

  const user = await getCurrentUser()

  return {
    userId: user?.uid || null,
    user: user,
    sessionClaims: user || null,
    role: user?.role || "student"
  }
}
