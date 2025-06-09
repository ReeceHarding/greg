import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminAuth } from "@/lib/firebase-config"
import { createSessionCookie } from "@/lib/firebase-auth"
import { createProfileAction } from "@/actions/db/profiles-actions"
import { isAdminEmailAction } from "@/actions/admin/admin-role-actions"

export async function POST(request: NextRequest) {
  console.log("[Session API] POST request received")

  try {
    const { idToken, isNewUser } = await request.json()
    console.log("[Session API] Processing session for new user:", !!isNewUser)
    console.log("[Session API] ID token length:", idToken?.length)

    // Extract first few chars of token for debugging (don't log full token)
    console.log(
      "[Session API] ID token preview:",
      idToken?.substring(0, 20) + "..."
    )

    // Check if adminAuth is available
    if (!adminAuth) {
      console.error("[Session API] Firebase Admin Auth not initialized")
      console.log(
        "[Session API] Checking FIREBASE_SERVICE_ACCOUNT_PATH:",
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      )
      return NextResponse.json(
        {
          error: "Firebase Admin Auth not configured. Please check server logs."
        },
        { status: 503 }
      )
    }

    console.log("[Session API] Firebase Admin Auth is available")
    console.log("[Session API] Attempting to verify ID token...")

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log("[Session API] Token verified successfully!")
    console.log("[Session API] User UID:", decodedToken.uid)
    console.log("[Session API] User email:", decodedToken.email)

    // Check if user is an admin
    const userEmail = decodedToken.email || ""
    const adminCheckResult = await isAdminEmailAction(userEmail)
    const isAdmin = adminCheckResult.isSuccess && adminCheckResult.data === true
    
    console.log("[Session API] Is user admin?", isAdmin)

    // Set custom claims based on admin status
    if (isAdmin) {
      console.log("[Session API] Setting admin custom claim for user")
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        role: "admin"
      })
    } else {
      console.log("[Session API] Setting student custom claim for user")
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        role: "student"
      })
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken)
    console.log("[Session API] Session cookie created")

    // Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/"
    })
    console.log("[Session API] Session cookie set")

    // If it's a new user, create their profile
    if (isNewUser) {
      console.log("[Session API] Creating profile for new user")
      const profileResult = await createProfileAction({
        userId: decodedToken.uid,
        email: decodedToken.email || "",
        displayName:
          decodedToken.name || decodedToken.email?.split("@")[0] || "",
        photoURL: decodedToken.picture || "",
        membership: "free"
      })

      if (!profileResult.isSuccess) {
        console.error(
          "[Session API] Failed to create profile:",
          profileResult.message
        )

        // Check if it's a Firestore not enabled error
        if (
          profileResult.message.includes("Firestore is not enabled") ||
          profileResult.message.includes("Firestore not enabled")
        ) {
          console.log("[Session API] Firestore is not enabled")
          return NextResponse.json(
            {
              error:
                "Firestore is not enabled. Please enable Firestore in your Firebase Console."
            },
            { status: 503 }
          )
        }
      } else {
        console.log("[Session API] Profile created successfully")
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Session API] Error creating session:", error)
    console.error("[Session API] Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    })

    // Provide more specific error messages
    if (
      error?.code === "auth/invalid-id-token" ||
      error?.code === "auth/id-token-expired"
    ) {
      return NextResponse.json(
        { error: "Invalid or expired authentication token" },
        { status: 401 }
      )
    }

    if (error?.message?.includes("Firebase ID token has incorrect")) {
      return NextResponse.json(
        { error: "Token validation failed - project mismatch" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[Session API] DELETE request received")

  try {
    // Clear the session cookie
    const cookieStore = await cookies()
    cookieStore.delete("session")
    console.log("[Session API] Session cookie deleted")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Session API] Error deleting session:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
}
