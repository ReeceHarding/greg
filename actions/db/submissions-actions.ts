"use server"

import { db, collections } from "@/db/db"
import { FirebaseSubmission } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Create a new submission
export async function createSubmissionAction(
  data: Omit<FirebaseSubmission, 'submissionId' | 'submittedAt' | 'lastUpdatedAt'>
): Promise<ActionState<FirebaseSubmission>> {
  try {
    console.log("[Submissions Action] Creating submission for student:", data.studentId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const submissionData = {
      ...data,
      submittedAt: data.status === 'submitted' ? FieldValue.serverTimestamp() : null,
      lastUpdatedAt: FieldValue.serverTimestamp()
    }
    
    const docRef = await db.collection(collections.submissions).add(submissionData)
    const submissionDoc = await docRef.get()
    const submission = { 
      submissionId: docRef.id, 
      ...submissionDoc.data() 
    } as FirebaseSubmission
    
    console.log("[Submissions Action] Submission created with ID:", docRef.id)
    
    return {
      isSuccess: true,
      message: "Submission created successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error creating submission:", error)
    return { isSuccess: false, message: "Failed to create submission" }
  }
}

// Get a single submission by ID
export async function getSubmissionAction(
  submissionId: string
): Promise<ActionState<FirebaseSubmission>> {
  try {
    console.log("[Submissions Action] Getting submission:", submissionId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const doc = await db.collection(collections.submissions).doc(submissionId).get()
    
    if (!doc.exists) {
      console.log("[Submissions Action] Submission not found")
      return { isSuccess: false, message: "Submission not found" }
    }
    
    const submission = { 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission
    
    console.log("[Submissions Action] Submission retrieved successfully")
    
    return {
      isSuccess: true,
      message: "Submission retrieved successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting submission:", error)
    return { isSuccess: false, message: "Failed to get submission" }
  }
}

// Get submissions by student
export async function getSubmissionsByStudentAction(
  studentId: string
): Promise<ActionState<FirebaseSubmission[]>> {
  try {
    console.log("[Submissions Action] Getting submissions for student:", studentId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.submissions)
      .where('studentId', '==', studentId)
      .orderBy('submittedAt', 'desc')
      .get()
    
    const submissions = snapshot.docs.map(doc => ({ 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission))
    
    console.log(`[Submissions Action] Retrieved ${submissions.length} submissions for student`)
    
    return {
      isSuccess: true,
      message: "Submissions retrieved successfully",
      data: submissions
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting submissions by student:", error)
    return { isSuccess: false, message: "Failed to get submissions" }
  }
}

// Get submissions by assignment
export async function getSubmissionsByAssignmentAction(
  assignmentId: string
): Promise<ActionState<FirebaseSubmission[]>> {
  try {
    console.log("[Submissions Action] Getting submissions for assignment:", assignmentId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.submissions)
      .where('assignmentId', '==', assignmentId)
      .orderBy('submittedAt', 'desc')
      .get()
    
    const submissions = snapshot.docs.map(doc => ({ 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission))
    
    console.log(`[Submissions Action] Retrieved ${submissions.length} submissions for assignment`)
    
    return {
      isSuccess: true,
      message: "Submissions retrieved successfully",
      data: submissions
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting submissions by assignment:", error)
    return { isSuccess: false, message: "Failed to get submissions" }
  }
}

// Get student's submission for a specific assignment
export async function getStudentSubmissionForAssignmentAction(
  studentId: string,
  assignmentId: string
): Promise<ActionState<FirebaseSubmission | null>> {
  try {
    console.log("[Submissions Action] Getting submission for student/assignment:", studentId, assignmentId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.submissions)
      .where('studentId', '==', studentId)
      .where('assignmentId', '==', assignmentId)
      .limit(1)
      .get()
    
    if (snapshot.empty) {
      console.log("[Submissions Action] No submission found")
      return {
        isSuccess: true,
        message: "No submission found",
        data: null
      }
    }
    
    const doc = snapshot.docs[0]
    const submission = { 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission
    
    console.log("[Submissions Action] Submission retrieved successfully")
    
    return {
      isSuccess: true,
      message: "Submission retrieved successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting student submission:", error)
    return { isSuccess: false, message: "Failed to get submission" }
  }
}

// Get submissions pending review (for instructors)
export async function getPendingReviewSubmissionsAction(): Promise<ActionState<FirebaseSubmission[]>> {
  try {
    console.log("[Submissions Action] Getting submissions pending review")
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db
      .collection(collections.submissions)
      .where('status', '==', 'submitted')
      .orderBy('submittedAt', 'asc')
      .get()
    
    const submissions = snapshot.docs.map(doc => ({ 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission))
    
    console.log(`[Submissions Action] Retrieved ${submissions.length} submissions pending review`)
    
    return {
      isSuccess: true,
      message: "Pending submissions retrieved successfully",
      data: submissions
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting pending submissions:", error)
    return { isSuccess: false, message: "Failed to get pending submissions" }
  }
}

// Update a submission
export async function updateSubmissionAction(
  submissionId: string,
  data: Partial<Omit<FirebaseSubmission, 'submissionId' | 'studentId' | 'assignmentId'>>
): Promise<ActionState<FirebaseSubmission>> {
  try {
    console.log("[Submissions Action] Updating submission:", submissionId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const updateData: any = {
      ...data,
      lastUpdatedAt: FieldValue.serverTimestamp()
    }
    
    // If status is changing to submitted, set submittedAt
    if (data.status === 'submitted' && !data.submittedAt) {
      updateData.submittedAt = FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.submissions).doc(submissionId).update(updateData)
    
    const doc = await db.collection(collections.submissions).doc(submissionId).get()
    const submission = { 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission
    
    console.log("[Submissions Action] Submission updated successfully")
    
    return {
      isSuccess: true,
      message: "Submission updated successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error updating submission:", error)
    return { isSuccess: false, message: "Failed to update submission" }
  }
}

// Add AI feedback to submission
export async function addAIFeedbackAction(
  submissionId: string,
  aiFeedback: FirebaseSubmission['aiFeedback']
): Promise<ActionState<FirebaseSubmission>> {
  try {
    console.log("[Submissions Action] Adding AI feedback to submission:", submissionId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const feedbackData = {
      ...aiFeedback,
      generatedAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.submissions).doc(submissionId).update({
      aiFeedback: feedbackData,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
    
    const doc = await db.collection(collections.submissions).doc(submissionId).get()
    const submission = { 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission
    
    console.log("[Submissions Action] AI feedback added successfully")
    
    return {
      isSuccess: true,
      message: "AI feedback added successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error adding AI feedback:", error)
    return { isSuccess: false, message: "Failed to add AI feedback" }
  }
}

// Add instructor feedback to submission
export async function addInstructorFeedbackAction(
  submissionId: string,
  instructorFeedback: Omit<NonNullable<FirebaseSubmission['instructorFeedback']>, 'reviewedAt'>
): Promise<ActionState<FirebaseSubmission>> {
  try {
    console.log("[Submissions Action] Adding instructor feedback to submission:", submissionId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const feedbackData = {
      ...instructorFeedback,
      reviewedAt: FieldValue.serverTimestamp()
    }
    
    await db.collection(collections.submissions).doc(submissionId).update({
      instructorFeedback: feedbackData,
      lastUpdatedAt: FieldValue.serverTimestamp()
    })
    
    const doc = await db.collection(collections.submissions).doc(submissionId).get()
    const submission = { 
      submissionId: doc.id, 
      ...doc.data() 
    } as FirebaseSubmission
    
    // If submission is approved, calculate points
    if (submission.status === "approved") {
      console.log("[Submissions Action] Submission approved, calculating points")
      const { calculatePointsForSubmissionAction } = await import("./gamification-actions")
      await calculatePointsForSubmissionAction(submissionId)
    }
    
    console.log("[Submissions Action] Instructor feedback added successfully")
    
    return {
      isSuccess: true,
      message: "Instructor feedback added successfully",
      data: submission
    }
  } catch (error) {
    console.error("[Submissions Action] Error adding instructor feedback:", error)
    return { isSuccess: false, message: "Failed to add instructor feedback" }
  }
}

// Delete a submission
export async function deleteSubmissionAction(
  submissionId: string
): Promise<ActionState<undefined>> {
  try {
    console.log("[Submissions Action] Deleting submission:", submissionId)
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    await db.collection(collections.submissions).doc(submissionId).delete()
    
    console.log("[Submissions Action] Submission deleted successfully")
    
    return {
      isSuccess: true,
      message: "Submission deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Submissions Action] Error deleting submission:", error)
    return { isSuccess: false, message: "Failed to delete submission" }
  }
}

// Get all submissions (for admin analytics)
export async function getAllSubmissionsAction(): Promise<ActionState<FirebaseSubmission[]>> {
  try {
    console.log("[Submissions Action] Getting all submissions")
    
    if (!db) {
      console.error("[Submissions Action] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const snapshot = await db.collection(collections.submissions).get()
    
    const allSubmissions = snapshot.docs.map(doc => ({ 
      submissionId: doc.id,
      ...doc.data() 
    } as FirebaseSubmission))
    
    console.log(`[Submissions Action] Retrieved ${allSubmissions.length} submissions`)
    
    return {
      isSuccess: true,
      message: "All submissions retrieved successfully",
      data: allSubmissions
    }
  } catch (error) {
    console.error("[Submissions Action] Error getting all submissions:", error)
    return { isSuccess: false, message: "Failed to get all submissions" }
  }
} 