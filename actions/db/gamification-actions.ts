"use server"

import { ActionState } from "@/types"
import { db, collections } from "@/db/db"
import { FirebaseProgress, FirebaseSubmission } from "@/types/firebase-types"
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// Point values
const POINTS = {
  ASSIGNMENT_COMPLETION: 100,
  ON_TIME_SUBMISSION: 20,
  FORUM_POST: 5,
  PERFECT_WEEK: 50,
  STREAK_BONUS_PER_DAY: 10,
  VIDEO_WATCHED: 2,
  FIRST_SUBMISSION: 50
}

// Badge definitions
const BADGES = {
  fast_starter: {
    id: "fast_starter",
    check: async (studentId: string, progress: FirebaseProgress) => {
      // Check if completed Week 1 in first week
      if (!db) return false
      
      const profile = await db.collection(collections.profiles).doc(studentId).get()
      if (!profile.exists) return false
      
      const joinedAt = profile.data()!.createdAt
      const week1Assignment = progress.assignmentsCompleted.find(a => a.includes("week-1"))
      if (!week1Assignment) return false
      
      const submission = await db.collection(collections.submissions)
        .where("studentId", "==", studentId)
        .where("assignmentId", "==", week1Assignment)
        .get()
      
      if (submission.empty) return false
      
      const submittedAt = submission.docs[0].data().submittedAt
      const daysSinceJoined = Math.floor((submittedAt.toDate().getTime() - joinedAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
      
      return daysSinceJoined <= 7
    }
  },
  consistent_contributor: {
    id: "consistent_contributor",
    check: async (studentId: string, progress: FirebaseProgress) => {
      // Check for 4 weeks of consecutive submissions
      return progress.currentStreak >= 28 // 4 weeks
    }
  },
  perfect_week: {
    id: "perfect_week",
    check: async (studentId: string, progress: FirebaseProgress) => {
      // Check if completed all activities in any week
      // For now, just check if they have at least one completed assignment
      return progress.assignmentsCompleted.length > 0
    }
  },
  ai_explorer: {
    id: "ai_explorer",
    check: async (studentId: string, progress: FirebaseProgress) => {
      // Check if watched 10+ videos
      return progress.videosWatched.length >= 10
    }
  },
  early_bird: {
    id: "early_bird",
    check: async (studentId: string, progress: FirebaseProgress) => {
      // Check if submitted 3 assignments before due date
      // For simplicity, check if they have 3 approved submissions
      if (!db) return false
      
      const submissions = await db.collection(collections.submissions)
        .where("studentId", "==", studentId)
        .where("status", "==", "approved")
        .get()
      
      return submissions.size >= 3
    }
  }
}

// Calculate points for a submission
export async function calculatePointsForSubmissionAction(
  submissionId: string
): Promise<ActionState<{ pointsAwarded: number; newTotal: number }>> {
  console.log(`[Gamification] Calculating points for submission: ${submissionId}`)
  
  try {
    if (!db) {
      console.error("[Gamification] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Get submission details
    const submissionDoc = await db.collection(collections.submissions).doc(submissionId).get()
    if (!submissionDoc.exists) {
      return { isSuccess: false, message: "Submission not found" }
    }
    
    const submission = submissionDoc.data() as FirebaseSubmission
    
    // Only calculate points for approved submissions
    if (submission.status !== "approved") {
      return { isSuccess: false, message: "Submission not approved yet" }
    }
    
    // Get student progress
    const progressDoc = await db.collection(collections.progress).doc(submission.studentId).get()
    
    let currentProgress: FirebaseProgress
    let currentPoints = 0
    
    if (progressDoc.exists) {
      currentProgress = progressDoc.data() as FirebaseProgress
      currentPoints = currentProgress.totalPoints || 0
    } else {
      // Create new progress document
      currentProgress = {
        progressId: submission.studentId,
        studentId: submission.studentId,
        currentWeek: 1,
        assignmentsCompleted: [],
        videosWatched: [],
        forumStats: {
          postsCreated: 0,
          repliesCreated: 0,
          upvotesReceived: 0,
          lastActiveAt: FieldValue.serverTimestamp() as any
        },
        weeklyReports: [],
        overallCompletionPercentage: 0,
        totalPoints: 0,
        currentStreak: 0,
        badges: [],
        lastCalculatedAt: FieldValue.serverTimestamp() as any
      }
    }
    
    // Calculate points
    let pointsAwarded = 0
    
    // Base points for assignment completion
    if (!currentProgress.assignmentsCompleted.includes(submission.assignmentId)) {
      pointsAwarded += POINTS.ASSIGNMENT_COMPLETION
      
      // Check if submitted on time (within 7 days of assignment release)
      const assignment = await db.collection(collections.assignments).doc(submission.assignmentId).get()
      if (assignment.exists && submission.submittedAt) {
        const dueDate = assignment.data()!.dueDate.toDate()
        const submittedDate = submission.submittedAt.toDate()
        
        if (submittedDate <= dueDate) {
          pointsAwarded += POINTS.ON_TIME_SUBMISSION
        }
      }
      
      // First submission bonus
      if (currentProgress.assignmentsCompleted.length === 0) {
        pointsAwarded += POINTS.FIRST_SUBMISSION
      }
    }
    
    // Update progress with new points
    const newTotal = currentPoints + pointsAwarded
    
    const updates: any = {
      totalPoints: newTotal,
      lastCalculatedAt: FieldValue.serverTimestamp()
    }
    
    // Add assignment to completed list if not already there
    if (!currentProgress.assignmentsCompleted.includes(submission.assignmentId)) {
      updates.assignmentsCompleted = FieldValue.arrayUnion(submission.assignmentId)
    }
    
    // Update or create progress document
    if (progressDoc.exists) {
      await db.collection(collections.progress).doc(submission.studentId).update(updates)
    } else {
      await db.collection(collections.progress).doc(submission.studentId).set({
        ...currentProgress,
        ...updates,
        assignmentsCompleted: [submission.assignmentId]
      })
    }
    
    // Check for new badges
    await checkAndAwardBadgesAction(submission.studentId)
    
    console.log(`[Gamification] Awarded ${pointsAwarded} points. New total: ${newTotal}`)
    
    return {
      isSuccess: true,
      message: `Awarded ${pointsAwarded} points`,
      data: { pointsAwarded, newTotal }
    }
  } catch (error) {
    console.error("[Gamification] Error calculating points:", error)
    return { isSuccess: false, message: "Failed to calculate points" }
  }
}

// Check and award badges
export async function checkAndAwardBadgesAction(
  studentId: string
): Promise<ActionState<{ newBadges: string[] }>> {
  console.log(`[Gamification] Checking badges for student: ${studentId}`)
  
  try {
    if (!db) {
      console.error("[Gamification] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Get student progress
    const progressDoc = await db.collection(collections.progress).doc(studentId).get()
    if (!progressDoc.exists) {
      return { isSuccess: false, message: "Progress not found" }
    }
    
    const progress = progressDoc.data() as FirebaseProgress
    const currentBadges = progress.badges || []
    const newBadges: string[] = []
    
    // Check each badge
    for (const [badgeId, badge] of Object.entries(BADGES)) {
      if (!currentBadges.includes(badgeId)) {
        const earned = await badge.check(studentId, progress)
        if (earned) {
          newBadges.push(badgeId)
          console.log(`[Gamification] Student earned badge: ${badgeId}`)
        }
      }
    }
    
    // Update badges if any new ones earned
    if (newBadges.length > 0) {
      await db.collection(collections.progress).doc(studentId).update({
        badges: FieldValue.arrayUnion(...newBadges)
      })
    }
    
    console.log(`[Gamification] Awarded ${newBadges.length} new badges`)
    
    return {
      isSuccess: true,
      message: `Awarded ${newBadges.length} new badges`,
      data: { newBadges }
    }
  } catch (error) {
    console.error("[Gamification] Error checking badges:", error)
    return { isSuccess: false, message: "Failed to check badges" }
  }
}

// Update streak (should be called daily)
export async function updateStreaksAction(): Promise<ActionState<{ updated: number }>> {
  console.log("[Gamification] Updating streaks for all students")
  
  try {
    if (!db) {
      console.error("[Gamification] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    const progressSnapshot = await db.collection(collections.progress).get()
    let updated = 0
    
    for (const doc of progressSnapshot.docs) {
      const progress = doc.data() as FirebaseProgress
      const lastActive = progress.lastCalculatedAt
      
      if (lastActive) {
        const daysSinceActive = Math.floor(
          (Date.now() - lastActive.toDate().getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceActive === 1) {
          // Continue streak
          await doc.ref.update({
            currentStreak: FieldValue.increment(1),
            totalPoints: FieldValue.increment(POINTS.STREAK_BONUS_PER_DAY)
          })
          updated++
        } else if (daysSinceActive > 1) {
          // Break streak
          await doc.ref.update({
            currentStreak: 0
          })
          updated++
        }
      }
    }
    
    console.log(`[Gamification] Updated ${updated} student streaks`)
    
    return {
      isSuccess: true,
      message: `Updated ${updated} streaks`,
      data: { updated }
    }
  } catch (error) {
    console.error("[Gamification] Error updating streaks:", error)
    return { isSuccess: false, message: "Failed to update streaks" }
  }
}

// Award points for video watched
export async function awardVideoWatchPointsAction(
  studentId: string,
  videoId: string
): Promise<ActionState<{ pointsAwarded: number }>> {
  console.log(`[Gamification] Awarding points for video watch: ${videoId}`)
  
  try {
    if (!db) {
      console.error("[Gamification] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }
    
    // Get student progress
    const progressDoc = await db.collection(collections.progress).doc(studentId).get()
    
    if (!progressDoc.exists) {
      return { isSuccess: false, message: "Progress not found" }
    }
    
    const progress = progressDoc.data() as FirebaseProgress
    
    // Check if video already watched
    const alreadyWatched = progress.videosWatched.some(v => v.videoId === videoId)
    
    if (alreadyWatched) {
      return {
        isSuccess: true,
        message: "Video already watched",
        data: { pointsAwarded: 0 }
      }
    }
    
    // Award points
    await progressDoc.ref.update({
      totalPoints: FieldValue.increment(POINTS.VIDEO_WATCHED),
      lastCalculatedAt: FieldValue.serverTimestamp()
    })
    
    console.log(`[Gamification] Awarded ${POINTS.VIDEO_WATCHED} points for video watch`)
    
    return {
      isSuccess: true,
      message: `Awarded ${POINTS.VIDEO_WATCHED} points`,
      data: { pointsAwarded: POINTS.VIDEO_WATCHED }
    }
  } catch (error) {
    console.error("[Gamification] Error awarding video points:", error)
    return { isSuccess: false, message: "Failed to award video points" }
  }
} 