/*
<ai_context>
Contains server actions related to profiles in Firebase Firestore.
</ai_context>
*/

"use server"

import { db, collections } from "@/db/db"
import { FirebaseProfile } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

export async function createProfileAction(
  data: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActionState<FirebaseProfile>> {
  console.log('[Profiles Action] Creating profile for user:', data.userId)
  console.log('[Profiles Action] Profile data:', JSON.stringify(data, null, 2))
  
  if (!db) {
    console.error('[Profiles Action] Database not initialized')
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const profileDataToCreate = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    
    console.log('[Profiles Action] Attempting to add document to collection:', collections.profiles)
    const docRef = await db.collection(collections.profiles).add(profileDataToCreate)
    console.log('[Profiles Action] Profile created with ID:', docRef.id)
    
    // Wait a bit for server timestamps to resolve
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const newProfile = await docRef.get()
    const retrievedProfileData = newProfile.data()
    
    // Handle case where data might be null
    if (!retrievedProfileData) {
      console.error('[Profiles Action] Profile data is null after creation')
      // Return with the data we know, using current date for timestamps
      const profileWithId = { 
        id: docRef.id, 
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      } as FirebaseProfile
      
      return {
        isSuccess: true,
        message: "Profile created successfully",
        data: profileWithId
      }
    }
    
    const profileWithId = { id: docRef.id, ...retrievedProfileData } as FirebaseProfile
    
    console.log('[Profiles Action] Profile created successfully')
    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: profileWithId
    }
  } catch (error: any) {
    // Simplify error logging to avoid source map issues in Next.js dev mode
    console.error("[Profiles Action] Error creating profile:", error?.message || "Unknown error")
    
    // Log specific error properties separately to avoid formatting issues
    if (error?.code) {
      console.error("[Profiles Action] Error code:", error.code)
    }
    
    // Check if it's a Firestore not enabled error
    if (error?.code === 5 || error?.code === 'NOT_FOUND' || error?.message?.includes('NOT_FOUND')) {
      console.error('[Profiles Action] Firestore is not enabled in Firebase project')
      return { 
        isSuccess: false, 
        message: "Firestore is not enabled. Please enable Firestore in your Firebase Console at https://console.firebase.google.com" 
      }
    }
    
    // Check if it's a permission error
    if (error?.code === 7 || error?.code === 'PERMISSION_DENIED') {
      console.error('[Profiles Action] Permission denied - check Firestore rules')
      return { 
        isSuccess: false, 
        message: "Permission denied. Please check your Firestore security rules." 
      }
    }
    
    return { isSuccess: false, message: `Failed to create profile: ${error?.message || 'Unknown error'}` }
  }
}

export async function getProfileByUserIdAction(
  userId: string
): Promise<ActionState<FirebaseProfile>> {
  console.log('[Profiles Action] Getting profile for user:', userId)
  
  if (!db) {
    console.error('[Profiles Action] Database not initialized')
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const querySnapshot = await db
      .collection(collections.profiles)
      .where('userId', '==', userId)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      console.log('[Profiles Action] Profile not found for user:', userId)
      return { isSuccess: false, message: "Profile not found" }
    }
    
    const doc = querySnapshot.docs[0]
    const profile = { id: doc.id, ...doc.data() } as FirebaseProfile
    
    console.log('[Profiles Action] Profile retrieved successfully')
    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    }
  } catch (error: any) {
    console.error("[Profiles Action] Error getting profile by user id:", error?.message || error)
    // If it's a NOT_FOUND error, it might be because the collection doesn't exist yet
    if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
      console.log('[Profiles Action] Collection might not exist yet. It will be created when first profile is added.')
      return { isSuccess: false, message: "Profile not found - collection may not exist yet" }
    }
    return { isSuccess: false, message: "Failed to get profile" }
  }
}

export async function updateProfileAction(
  userId: string,
  data: Partial<Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ActionState<FirebaseProfile>> {
  console.log('[Profiles Action] Updating profile for user:', userId)
  
  if (!db) {
    console.error('[Profiles Action] Database not initialized')
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    // First find the profile
    const querySnapshot = await db
      .collection(collections.profiles)
      .where('userId', '==', userId)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      console.log('[Profiles Action] Profile not found for update')
      return { isSuccess: false, message: "Profile not found to update" }
    }
    
    const doc = querySnapshot.docs[0]
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    }
    
    await doc.ref.update(updateData)
    console.log('[Profiles Action] Profile updated in Firestore')
    
    const updatedDoc = await doc.ref.get()
    const updatedProfile = { id: doc.id, ...updatedDoc.data() } as FirebaseProfile
    
    console.log('[Profiles Action] Profile updated successfully')
    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("[Profiles Action] Error updating profile:", error)
    return { isSuccess: false, message: "Failed to update profile" }
  }
}

export async function updateProfileByStripeCustomerIdAction(
  stripeCustomerId: string,
  data: Partial<Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ActionState<FirebaseProfile>> {
  console.log('[Profiles Action] Updating profile by Stripe customer ID:', stripeCustomerId)
  
  if (!db) {
    console.error('[Profiles Action] Database not initialized')
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const querySnapshot = await db
      .collection(collections.profiles)
      .where('stripeCustomerId', '==', stripeCustomerId)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      console.log('[Profiles Action] Profile not found by Stripe customer ID')
      return {
        isSuccess: false,
        message: "Profile not found by Stripe customer ID"
      }
    }
    
    const doc = querySnapshot.docs[0]
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    }
    
    await doc.ref.update(updateData)
    console.log('[Profiles Action] Profile updated by Stripe customer ID')
    
    const updatedDoc = await doc.ref.get()
    const updatedProfile = { id: doc.id, ...updatedDoc.data() } as FirebaseProfile
    
    console.log('[Profiles Action] Profile updated successfully')
    return {
      isSuccess: true,
      message: "Profile updated by Stripe customer ID successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("[Profiles Action] Error updating profile by stripe customer ID:", error)
    return {
      isSuccess: false,
      message: "Failed to update profile by Stripe customer ID"
    }
  }
}

export async function deleteProfileAction(
  userId: string
): Promise<ActionState<void>> {
  console.log('[Profiles Action] Deleting profile for user:', userId)
  
  if (!db) {
    console.error('[Profiles Action] Database not initialized')
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const querySnapshot = await db
      .collection(collections.profiles)
      .where('userId', '==', userId)
      .limit(1)
      .get()
    
    if (!querySnapshot.empty) {
      await querySnapshot.docs[0].ref.delete()
      console.log('[Profiles Action] Profile deleted successfully')
    } else {
      console.log('[Profiles Action] No profile found to delete')
    }
    
    return {
      isSuccess: true,
      message: "Profile deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Profiles Action] Error deleting profile:", error)
    return { isSuccess: false, message: "Failed to delete profile" }
  }
}

// Get all profiles (for admin analytics)
export async function getAllProfilesAction(): Promise<ActionState<FirebaseProfile[]>> {
  try {
    console.log("[Profiles Action] Getting all profiles")
    
    if (!db) {
      console.error("[Profiles Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db.collection(collections.profiles).get()
    
    const allProfiles = snapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    } as FirebaseProfile))
    
    console.log(`[Profiles Action] Retrieved ${allProfiles.length} profiles`)
    
    return {
      isSuccess: true,
      message: "All profiles retrieved successfully",
      data: allProfiles
    }
  } catch (error) {
    console.error("[Profiles Action] Error getting all profiles:", error)
    return { isSuccess: false, message: "Failed to get all profiles" }
  }
}
