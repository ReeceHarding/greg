"use server"

import { db, collections } from "@/db/db"
import { FirebaseUser } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Create a new user
export async function createUserAction(
  data: Omit<FirebaseUser, 'joinedAt' | 'lastActiveAt'>
): Promise<ActionState<FirebaseUser>> {
  try {
    console.log("[Users Action] Creating user with UID:", data.uid)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const userData = {
      ...data,
      joinedAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.users).doc(data.uid).set(userData)
    
    const userDoc = await db.collection(collections.users).doc(data.uid).get()
    const user = { ...userDoc.data() } as FirebaseUser
    
    console.log("[Users Action] User created successfully")
    
    return {
      isSuccess: true,
      message: "User created successfully",
      data: user
    }
  } catch (error) {
    console.error("[Users Action] Error creating user:", error)
    return { isSuccess: false, message: "Failed to create user" }
  }
}

// Get a user by UID
export async function getUserAction(
  uid: string
): Promise<ActionState<FirebaseUser>> {
  try {
    console.log("[Users Action] Getting user with UID:", uid)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const userDoc = await db.collection(collections.users).doc(uid).get()
    
    if (!userDoc.exists) {
      console.log("[Users Action] User not found")
      return { isSuccess: false, message: "User not found" }
    }
    
    const user = { ...userDoc.data() } as FirebaseUser
    console.log("[Users Action] User retrieved successfully")
    
    return {
      isSuccess: true,
      message: "User retrieved successfully",
      data: user
    }
  } catch (error) {
    console.error("[Users Action] Error getting user:", error)
    return { isSuccess: false, message: "Failed to get user" }
  }
}

// Get all users (admin only)
export async function getAllUsersAction(): Promise<ActionState<FirebaseUser[]>> {
  try {
    console.log("[Users Action] Getting all users")
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db.collection(collections.users).get()
    const users = snapshot.docs.map(doc => ({ ...doc.data() } as FirebaseUser))
    
    console.log(`[Users Action] Retrieved ${users.length} users`)
    
    return {
      isSuccess: true,
      message: "Users retrieved successfully",
      data: users
    }
  } catch (error) {
    console.error("[Users Action] Error getting users:", error)
    return { isSuccess: false, message: "Failed to get users" }
  }
}

// Get users by role
export async function getUsersByRoleAction(
  role: "student" | "admin"
): Promise<ActionState<FirebaseUser[]>> {
  try {
    console.log("[Users Action] Getting users with role:", role)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.users)
      .where('role', '==', role)
      .get()
    
    const users = snapshot.docs.map(doc => ({ ...doc.data() } as FirebaseUser))
    
    console.log(`[Users Action] Retrieved ${users.length} users with role ${role}`)
    
    return {
      isSuccess: true,
      message: "Users retrieved successfully",
      data: users
    }
  } catch (error) {
    console.error("[Users Action] Error getting users by role:", error)
    return { isSuccess: false, message: "Failed to get users" }
  }
}

// Update user
export async function updateUserAction(
  uid: string,
  data: Partial<FirebaseUser>
): Promise<ActionState<FirebaseUser>> {
  try {
    console.log("[Users Action] Updating user:", uid)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const updateData = {
      ...data,
      lastActiveAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.users).doc(uid).update(updateData)
    
    const userDoc = await db.collection(collections.users).doc(uid).get()
    const user = { ...userDoc.data() } as FirebaseUser
    
    console.log("[Users Action] User updated successfully")
    
    return {
      isSuccess: true,
      message: "User updated successfully",
      data: user
    }
  } catch (error) {
    console.error("[Users Action] Error updating user:", error)
    return { isSuccess: false, message: "Failed to update user" }
  }
}

// Update user onboarding status
export async function updateUserOnboardingAction(
  uid: string,
  onboardingUpdate: Partial<FirebaseUser['onboardingStatus']>
): Promise<ActionState<FirebaseUser>> {
  try {
    console.log("[Users Action] Updating user onboarding status:", uid)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const userDoc = await db.collection(collections.users).doc(uid).get()
    if (!userDoc.exists) {
      return { isSuccess: false, message: "User not found" }
    }
    
    const currentUser = userDoc.data() as FirebaseUser
    const updatedOnboarding = {
      ...currentUser.onboardingStatus,
      ...onboardingUpdate
    }
    
    // Check if all onboarding steps are complete
    const allComplete = Object.values(updatedOnboarding).every(
      value => value === true || value !== false
    )
    
    if (allComplete && !updatedOnboarding.completedAt) {
      updatedOnboarding.completedAt = FieldValue.serverTimestamp() as any
    }
    
    await db.collection(collections.users).doc(uid).update({
      onboardingStatus: updatedOnboarding,
      lastActiveAt: FieldValue.serverTimestamp()
    })
    
    const updatedDoc = await db.collection(collections.users).doc(uid).get()
    const user = { ...updatedDoc.data() } as FirebaseUser
    
    console.log("[Users Action] Onboarding status updated successfully")
    
    return {
      isSuccess: true,
      message: "Onboarding status updated successfully",
      data: user
    }
  } catch (error) {
    console.error("[Users Action] Error updating onboarding status:", error)
    return { isSuccess: false, message: "Failed to update onboarding status" }
  }
}

// Delete user (admin only)
export async function deleteUserAction(
  uid: string
): Promise<ActionState<undefined>> {
  try {
    console.log("[Users Action] Deleting user:", uid)
    
    if (!db) {
      console.error("[Users Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    await db.collection(collections.users).doc(uid).delete()
    
    console.log("[Users Action] User deleted successfully")
    
    return {
      isSuccess: true,
      message: "User deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Users Action] Error deleting user:", error)
    return { isSuccess: false, message: "Failed to delete user" }
  }
} 