"use server"

import { db } from "@/db/db"
import { adminAuth } from "@/lib/firebase-config"
import { ActionState } from "@/types"
import { FieldValue } from "firebase-admin/firestore"

interface AdminEmail {
  email: string
  addedBy: string
  addedAt: Date | string
}

interface AdminEmailDoc {
  email: string
  addedBy: string
  addedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue
}

// Create admin email entry
export async function addAdminEmailAction(
  email: string,
  addedBy: string
): Promise<ActionState<AdminEmail>> {
  try {
    console.log("[AdminRole] Adding admin email:", email)
    
    if (!db) {
      return { isSuccess: false, message: "Database not initialized" }
    }

    // Check if email already exists
    const existing = await db.collection("adminEmails").doc(email).get()
    if (existing.exists) {
      return { isSuccess: false, message: "Email is already an admin" }
    }

    const adminEmailData: AdminEmailDoc = {
      email,
      addedBy,
      addedAt: FieldValue.serverTimestamp()
    }

    await db.collection("adminEmails").doc(email).set(adminEmailData)

    // Set custom claims for existing user with this email
    await setAdminClaimForEmail(email)

    return {
      isSuccess: true,
      message: "Admin email added successfully",
      data: {
        email,
        addedBy,
        addedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error("[AdminRole] Error adding admin email:", error)
    return { isSuccess: false, message: "Failed to add admin email" }
  }
}

// Remove admin email entry
export async function removeAdminEmailAction(
  email: string
): Promise<ActionState<undefined>> {
  try {
    console.log("[AdminRole] Removing admin email:", email)
    
    if (!db) {
      return { isSuccess: false, message: "Database not initialized" }
    }

    await db.collection("adminEmails").doc(email).delete()

    // Remove custom claims for existing user with this email
    await removeAdminClaimForEmail(email)

    return {
      isSuccess: true,
      message: "Admin email removed successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[AdminRole] Error removing admin email:", error)
    return { isSuccess: false, message: "Failed to remove admin email" }
  }
}

// Get all admin emails
export async function getAdminEmailsAction(): Promise<ActionState<AdminEmail[]>> {
  try {
    console.log("[AdminRole] Getting all admin emails")
    
    if (!db) {
      return { isSuccess: false, message: "Database not initialized" }
    }

    const snapshot = await db.collection("adminEmails").get()
    const adminEmails: AdminEmail[] = []

    snapshot.forEach(doc => {
      const data = doc.data() as AdminEmailDoc
      adminEmails.push({
        email: data.email,
        addedBy: data.addedBy,
        addedAt: data.addedAt && typeof data.addedAt === 'object' && 'toDate' in data.addedAt
          ? data.addedAt.toDate().toISOString()
          : new Date().toISOString()
      })
    })

    return {
      isSuccess: true,
      message: "Admin emails retrieved successfully",
      data: adminEmails
    }
  } catch (error) {
    console.error("[AdminRole] Error getting admin emails:", error)
    return { isSuccess: false, message: "Failed to get admin emails" }
  }
}

// Check if email is admin
export async function isAdminEmailAction(email: string): Promise<ActionState<boolean>> {
  try {
    console.log("[AdminRole] Checking if email is admin:", email)
    
    if (!db) {
      return { isSuccess: false, message: "Database not initialized" }
    }

    const doc = await db.collection("adminEmails").doc(email).get()
    
    return {
      isSuccess: true,
      message: "Admin check completed",
      data: doc.exists
    }
  } catch (error) {
    console.error("[AdminRole] Error checking admin email:", error)
    return { isSuccess: false, message: "Failed to check admin email" }
  }
}

// Helper to set admin custom claim for a user by email
async function setAdminClaimForEmail(email: string): Promise<void> {
  try {
    if (!adminAuth) {
      console.error("[AdminRole] Firebase Admin Auth not initialized")
      return
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email)
    
    // Set custom user claims
    await adminAuth.setCustomUserClaims(user.uid, {
      role: "admin"
    })
    
    console.log("[AdminRole] Admin claim set for user:", user.uid)
  } catch (error) {
    // User might not exist yet, which is fine
    console.log("[AdminRole] Could not set admin claim - user may not exist yet:", email)
  }
}

// Helper to remove admin custom claim for a user by email
async function removeAdminClaimForEmail(email: string): Promise<void> {
  try {
    if (!adminAuth) {
      console.error("[AdminRole] Firebase Admin Auth not initialized")
      return
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email)
    
    // Remove custom user claims
    await adminAuth.setCustomUserClaims(user.uid, {
      role: "student"
    })
    
    console.log("[AdminRole] Admin claim removed for user:", user.uid)
  } catch (error) {
    // User might not exist, which is fine
    console.log("[AdminRole] Could not remove admin claim - user may not exist:", email)
  }
} 