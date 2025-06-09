"use server"

import { db, collections } from "@/db/db"
import { FirebaseAssignment } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Create a new assignment
export async function createAssignmentAction(
  data: Omit<FirebaseAssignment, 'assignmentId' | 'createdAt' | 'updatedAt'>
): Promise<ActionState<FirebaseAssignment>> {
  try {
    console.log("[Assignments Action] Creating assignment:", data.title)
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const assignmentData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    
    const docRef = await db.collection(collections.assignments).add(assignmentData)
    const assignmentDoc = await docRef.get()
    const assignment = { 
      assignmentId: docRef.id, 
      ...assignmentDoc.data() 
    } as FirebaseAssignment
    
    console.log("[Assignments Action] Assignment created with ID:", docRef.id)
    
    return {
      isSuccess: true,
      message: "Assignment created successfully",
      data: assignment
    }
  } catch (error) {
    console.error("[Assignments Action] Error creating assignment:", error)
    return { isSuccess: false, message: "Failed to create assignment" }
  }
}

// Get a single assignment by ID
export async function getAssignmentAction(
  assignmentId: string
): Promise<ActionState<FirebaseAssignment>> {
  try {
    console.log("[Assignments Action] Getting assignment:", assignmentId)
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const doc = await db.collection(collections.assignments).doc(assignmentId).get()
    
    if (!doc.exists) {
      console.log("[Assignments Action] Assignment not found")
      return { isSuccess: false, message: "Assignment not found" }
    }
    
    const assignment = { 
      assignmentId: doc.id, 
      ...doc.data() 
    } as FirebaseAssignment
    
    console.log("[Assignments Action] Assignment retrieved successfully")
    
    return {
      isSuccess: true,
      message: "Assignment retrieved successfully",
      data: assignment
    }
  } catch (error) {
    console.error("[Assignments Action] Error getting assignment:", error)
    return { isSuccess: false, message: "Failed to get assignment" }
  }
}

// Get all assignments
export async function getAllAssignmentsAction(): Promise<ActionState<FirebaseAssignment[]>> {
  try {
    console.log("[Assignments Action] Getting all assignments")
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.assignments)
      .orderBy('order', 'asc')
      .orderBy('weekNumber', 'asc')
      .get()
    
    const assignments = snapshot.docs.map(doc => ({ 
      assignmentId: doc.id, 
      ...doc.data() 
    } as FirebaseAssignment))
    
    console.log(`[Assignments Action] Retrieved ${assignments.length} assignments`)
    
    return {
      isSuccess: true,
      message: "Assignments retrieved successfully",
      data: assignments
    }
  } catch (error) {
    console.error("[Assignments Action] Error getting assignments:", error)
    return { isSuccess: false, message: "Failed to get assignments" }
  }
}

// Get assignments by week
export async function getAssignmentsByWeekAction(
  weekNumber: number
): Promise<ActionState<FirebaseAssignment[]>> {
  try {
    console.log("[Assignments Action] Getting assignments for week:", weekNumber)
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.assignments)
      .where('weekNumber', '==', weekNumber)
      .orderBy('order', 'asc')
      .get()
    
    const assignments = snapshot.docs.map(doc => ({ 
      assignmentId: doc.id, 
      ...doc.data() 
    } as FirebaseAssignment))
    
    console.log(`[Assignments Action] Retrieved ${assignments.length} assignments for week ${weekNumber}`)
    
    return {
      isSuccess: true,
      message: "Assignments retrieved successfully",
      data: assignments
    }
  } catch (error) {
    console.error("[Assignments Action] Error getting assignments by week:", error)
    return { isSuccess: false, message: "Failed to get assignments" }
  }
}

// Get current week's assignments
export async function getCurrentWeekAssignmentsAction(): Promise<ActionState<FirebaseAssignment[]>> {
  try {
    console.log("[Assignments Action] Getting current week assignments")
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const now = new Date()
    const snapshot = await db
      .collection(collections.assignments)
      .where('dueDate', '>=', now)
      .orderBy('dueDate', 'asc')
      .limit(10)
      .get()
    
    const assignments = snapshot.docs.map(doc => ({ 
      assignmentId: doc.id, 
      ...doc.data() 
    } as FirebaseAssignment))
    
    console.log(`[Assignments Action] Retrieved ${assignments.length} current assignments`)
    
    return {
      isSuccess: true,
      message: "Current assignments retrieved successfully",
      data: assignments
    }
  } catch (error) {
    console.error("[Assignments Action] Error getting current assignments:", error)
    return { isSuccess: false, message: "Failed to get current assignments" }
  }
}

// Update an assignment
export async function updateAssignmentAction(
  assignmentId: string,
  data: Partial<Omit<FirebaseAssignment, 'assignmentId' | 'createdAt'>>
): Promise<ActionState<FirebaseAssignment>> {
  try {
    console.log("[Assignments Action] Updating assignment:", assignmentId)
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.assignments).doc(assignmentId).update(updateData)
    
    const doc = await db.collection(collections.assignments).doc(assignmentId).get()
    const assignment = { 
      assignmentId: doc.id, 
      ...doc.data() 
    } as FirebaseAssignment
    
    console.log("[Assignments Action] Assignment updated successfully")
    
    return {
      isSuccess: true,
      message: "Assignment updated successfully",
      data: assignment
    }
  } catch (error) {
    console.error("[Assignments Action] Error updating assignment:", error)
    return { isSuccess: false, message: "Failed to update assignment" }
  }
}

// Delete an assignment
export async function deleteAssignmentAction(
  assignmentId: string
): Promise<ActionState<undefined>> {
  try {
    console.log("[Assignments Action] Deleting assignment:", assignmentId)
    
    if (!db) {
      console.error("[Assignments Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    await db.collection(collections.assignments).doc(assignmentId).delete()
    
    console.log("[Assignments Action] Assignment deleted successfully")
    
    return {
      isSuccess: true,
      message: "Assignment deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Assignments Action] Error deleting assignment:", error)
    return { isSuccess: false, message: "Failed to delete assignment" }
  }
} 