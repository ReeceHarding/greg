"use server"

import { db, collections } from "@/db/db"
import { FirebaseLiveSession, SerializedFirebaseLiveSession } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Helper function to convert Firestore Timestamps to Dates
function serializeSession(session: any): SerializedFirebaseLiveSession {
  return {
    ...session,
    scheduledAt: session.scheduledAt?.toDate ? session.scheduledAt.toDate() : session.scheduledAt,
    createdAt: session.createdAt?.toDate ? session.createdAt.toDate() : session.createdAt,
    updatedAt: session.updatedAt?.toDate ? session.updatedAt.toDate() : session.updatedAt
  }
}

// Create a new live session
export async function createLiveSessionAction(
  data: Omit<FirebaseLiveSession, 'sessionId' | 'createdAt' | 'updatedAt' | 'registeredStudents' | 'attendedStudents'>
): Promise<ActionState<SerializedFirebaseLiveSession>> {
  try {
    console.log("[Sessions Action] Creating live session:", data.title)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const sessionData = {
      ...data,
      registeredStudents: [],
      attendedStudents: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    
    const docRef = await db.collection(collections.liveSessions).add(sessionData)
    const sessionDoc = await docRef.get()
    const rawSession = { 
      sessionId: docRef.id, 
      ...sessionDoc.data() 
    }
    const session = serializeSession(rawSession)
    
    console.log("[Sessions Action] Session created with ID:", docRef.id)
    
    return {
      isSuccess: true,
      message: "Session created successfully",
      data: session
    }
  } catch (error) {
    console.error("[Sessions Action] Error creating session:", error)
    return { isSuccess: false, message: "Failed to create session" }
  }
}

// Get all live sessions
export async function getAllLiveSessionsAction(): Promise<ActionState<SerializedFirebaseLiveSession[]>> {
  try {
    console.log("[Sessions Action] Getting all live sessions")
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.liveSessions)
      .orderBy('scheduledAt', 'asc')
      .get()
    
    const sessions = snapshot.docs.map(doc => 
      serializeSession({ 
        sessionId: doc.id, 
        ...doc.data() 
      })
    )
    
    console.log(`[Sessions Action] Retrieved ${sessions.length} sessions`)
    
    return {
      isSuccess: true,
      message: "Sessions retrieved successfully",
      data: sessions
    }
  } catch (error) {
    console.error("[Sessions Action] Error getting sessions:", error)
    return { isSuccess: false, message: "Failed to get sessions" }
  }
}

// Get upcoming sessions
export async function getUpcomingSessionsAction(): Promise<ActionState<SerializedFirebaseLiveSession[]>> {
  try {
    console.log("[Sessions Action] Getting upcoming sessions")
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const now = new Date()
    const snapshot = await db
      .collection(collections.liveSessions)
      .where('scheduledAt', '>=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(10)
      .get()
    
    const sessions = snapshot.docs.map(doc => 
      serializeSession({ 
        sessionId: doc.id, 
        ...doc.data() 
      })
    )
    
    console.log(`[Sessions Action] Retrieved ${sessions.length} upcoming sessions`)
    
    return {
      isSuccess: true,
      message: "Upcoming sessions retrieved successfully",
      data: sessions
    }
  } catch (error) {
    console.error("[Sessions Action] Error getting upcoming sessions:", error)
    return { isSuccess: false, message: "Failed to get upcoming sessions" }
  }
}

// Get a single session by ID
export async function getSessionAction(
  sessionId: string
): Promise<ActionState<FirebaseLiveSession>> {
  try {
    console.log("[Sessions Action] Getting session:", sessionId)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const doc = await db.collection(collections.liveSessions).doc(sessionId).get()
    
    if (!doc.exists) {
      console.log("[Sessions Action] Session not found")
      return { isSuccess: false, message: "Session not found" }
    }
    
    const session = { 
      sessionId: doc.id, 
      ...doc.data() 
    } as FirebaseLiveSession
    
    console.log("[Sessions Action] Session retrieved successfully")
    
    return {
      isSuccess: true,
      message: "Session retrieved successfully",
      data: session
    }
  } catch (error) {
    console.error("[Sessions Action] Error getting session:", error)
    return { isSuccess: false, message: "Failed to get session" }
  }
}

// Register student for a session
export async function registerForSessionAction(
  sessionId: string,
  studentId: string
): Promise<ActionState<FirebaseLiveSession>> {
  try {
    console.log(`[Sessions Action] Registering student ${studentId} for session ${sessionId}`)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Get current session
    const sessionDoc = await db.collection(collections.liveSessions).doc(sessionId).get()
    
    if (!sessionDoc.exists) {
      return { isSuccess: false, message: "Session not found" }
    }
    
    const session = sessionDoc.data() as FirebaseLiveSession
    
    // Check if already registered
    if (session.registeredStudents.includes(studentId)) {
      console.log("[Sessions Action] Student already registered")
      return {
        isSuccess: true,
        message: "Already registered for this session",
        data: { ...session, sessionId } as FirebaseLiveSession
      }
    }
    
    // Add student to registered list
    await db.collection(collections.liveSessions).doc(sessionId).update({
      registeredStudents: FieldValue.arrayUnion(studentId),
      updatedAt: FieldValue.serverTimestamp()
    })
    
    // Get updated session
    const updatedDoc = await db.collection(collections.liveSessions).doc(sessionId).get()
    const updatedSession = { 
      sessionId: updatedDoc.id, 
      ...updatedDoc.data() 
    } as FirebaseLiveSession
    
    console.log("[Sessions Action] Student registered successfully")
    
    return {
      isSuccess: true,
      message: "Registered for session successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error("[Sessions Action] Error registering for session:", error)
    return { isSuccess: false, message: "Failed to register for session" }
  }
}

// Unregister student from a session
export async function unregisterFromSessionAction(
  sessionId: string,
  studentId: string
): Promise<ActionState<FirebaseLiveSession>> {
  try {
    console.log(`[Sessions Action] Unregistering student ${studentId} from session ${sessionId}`)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Remove student from registered list
    await db.collection(collections.liveSessions).doc(sessionId).update({
      registeredStudents: FieldValue.arrayRemove(studentId),
      updatedAt: FieldValue.serverTimestamp()
    })
    
    // Get updated session
    const updatedDoc = await db.collection(collections.liveSessions).doc(sessionId).get()
    const updatedSession = { 
      sessionId: updatedDoc.id, 
      ...updatedDoc.data() 
    } as FirebaseLiveSession
    
    console.log("[Sessions Action] Student unregistered successfully")
    
    return {
      isSuccess: true,
      message: "Unregistered from session successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error("[Sessions Action] Error unregistering from session:", error)
    return { isSuccess: false, message: "Failed to unregister from session" }
  }
}

// Mark student attendance
export async function markAttendanceAction(
  sessionId: string,
  studentId: string
): Promise<ActionState<FirebaseLiveSession>> {
  try {
    console.log(`[Sessions Action] Marking attendance for student ${studentId} in session ${sessionId}`)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Add student to attended list
    await db.collection(collections.liveSessions).doc(sessionId).update({
      attendedStudents: FieldValue.arrayUnion(studentId),
      updatedAt: FieldValue.serverTimestamp()
    })
    
    // Get updated session
    const updatedDoc = await db.collection(collections.liveSessions).doc(sessionId).get()
    const updatedSession = { 
      sessionId: updatedDoc.id, 
      ...updatedDoc.data() 
    } as FirebaseLiveSession
    
    console.log("[Sessions Action] Attendance marked successfully")
    
    return {
      isSuccess: true,
      message: "Attendance marked successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error("[Sessions Action] Error marking attendance:", error)
    return { isSuccess: false, message: "Failed to mark attendance" }
  }
}

// Update session details
export async function updateSessionAction(
  sessionId: string,
  data: Partial<Omit<FirebaseLiveSession, 'sessionId' | 'createdAt'>>
): Promise<ActionState<FirebaseLiveSession>> {
  try {
    console.log("[Sessions Action] Updating session:", sessionId)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.liveSessions).doc(sessionId).update(updateData)
    
    const doc = await db.collection(collections.liveSessions).doc(sessionId).get()
    const session = { 
      sessionId: doc.id, 
      ...doc.data() 
    } as FirebaseLiveSession
    
    console.log("[Sessions Action] Session updated successfully")
    
    return {
      isSuccess: true,
      message: "Session updated successfully",
      data: session
    }
  } catch (error) {
    console.error("[Sessions Action] Error updating session:", error)
    return { isSuccess: false, message: "Failed to update session" }
  }
}

// Delete a session
export async function deleteSessionAction(
  sessionId: string
): Promise<ActionState<undefined>> {
  try {
    console.log("[Sessions Action] Deleting session:", sessionId)
    
    if (!db) {
      console.error("[Sessions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    await db.collection(collections.liveSessions).doc(sessionId).delete()
    
    console.log("[Sessions Action] Session deleted successfully")
    
    return {
      isSuccess: true,
      message: "Session deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Sessions Action] Error deleting session:", error)
    return { isSuccess: false, message: "Failed to delete session" }
  }
} 