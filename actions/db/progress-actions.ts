"use server"

import { db, collections } from "@/db/db"
import { ActionState } from "@/types"
import { FirebaseProgress, VideoWatchRecord, WeeklyReport } from "@/types/firebase-types"
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// Create or update progress document
export async function updateProgressAction(
  studentId: string,
  data: {
    assignmentCompleted?: string
    videoWatched?: VideoWatchRecord
    forumActivity?: {
      postsCreated?: number
      repliesCreated?: number
      upvotesReceived?: number
    }
  }
): Promise<ActionState<FirebaseProgress>> {
  console.log(`[Progress Actions] Updating progress for student: ${studentId}`)
  
  if (!db) {
    console.error("[Progress Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const progressRef = db.collection(collections.progress).doc(studentId)
    const progressDoc = await progressRef.get()
    
    if (!progressDoc.exists) {
      // Create new progress document
      console.log(`[Progress Actions] Creating new progress document for: ${studentId}`)
      
      const newProgress: FirebaseProgress = {
        progressId: studentId,
        studentId,
        currentWeek: 1,
        assignmentsCompleted: data.assignmentCompleted ? [data.assignmentCompleted] : [],
        videosWatched: data.videoWatched ? [data.videoWatched] : [],
        forumStats: {
          postsCreated: data.forumActivity?.postsCreated || 0,
          repliesCreated: data.forumActivity?.repliesCreated || 0,
          upvotesReceived: data.forumActivity?.upvotesReceived || 0,
          lastActiveAt: FieldValue.serverTimestamp() as unknown as Timestamp
        },
        weeklyReports: [],
        overallCompletionPercentage: 0,
        lastCalculatedAt: FieldValue.serverTimestamp() as unknown as Timestamp
      }
      
      await progressRef.set(newProgress)
    } else {
      // Update existing progress
      const updates: any = {
        lastCalculatedAt: FieldValue.serverTimestamp()
      }
      
      if (data.assignmentCompleted) {
        updates.assignmentsCompleted = FieldValue.arrayUnion(data.assignmentCompleted)
      }
      
      if (data.videoWatched) {
        // Check if video already exists and update or add
        const currentProgress = progressDoc.data() as FirebaseProgress
        const existingVideos = currentProgress.videosWatched || []
        const existingIndex = existingVideos.findIndex(v => v.videoId === data.videoWatched!.videoId)
        
        if (existingIndex >= 0) {
          // Update existing video watch record
          existingVideos[existingIndex] = data.videoWatched
          updates.videosWatched = existingVideos
        } else {
          // Add new video watch record
          updates.videosWatched = FieldValue.arrayUnion(data.videoWatched)
        }
      }
      
      if (data.forumActivity) {
        if (data.forumActivity.postsCreated) {
          updates["forumStats.postsCreated"] = FieldValue.increment(data.forumActivity.postsCreated)
        }
        if (data.forumActivity.repliesCreated) {
          updates["forumStats.repliesCreated"] = FieldValue.increment(data.forumActivity.repliesCreated)
        }
        if (data.forumActivity.upvotesReceived) {
          updates["forumStats.upvotesReceived"] = FieldValue.increment(data.forumActivity.upvotesReceived)
        }
        updates["forumStats.lastActiveAt"] = FieldValue.serverTimestamp()
      }
      
      await progressRef.update(updates)
    }
    
    // Calculate completion percentage
    await calculateCompletionPercentageAction(studentId)
    
    // Get updated progress
    const updatedDoc = await progressRef.get()
    const updatedProgress = {
      ...updatedDoc.data()
    } as FirebaseProgress
    
    console.log(`[Progress Actions] Progress updated successfully`)
    
    return {
      isSuccess: true,
      message: "Progress updated successfully",
      data: updatedProgress
    }
  } catch (error) {
    console.error("[Progress Actions] Error updating progress:", error)
    return { isSuccess: false, message: "Failed to update progress" }
  }
}

// Calculate overall completion percentage
export async function calculateCompletionPercentageAction(
  studentId: string
): Promise<ActionState<number>> {
  console.log(`[Progress Actions] Calculating completion percentage for: ${studentId}`)
  
  if (!db) {
    console.error("[Progress Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const progressRef = db.collection(collections.progress).doc(studentId)
    const progressDoc = await progressRef.get()
    
    if (!progressDoc.exists) {
      return { isSuccess: false, message: "Progress not found" }
    }
    
    const progress = progressDoc.data() as FirebaseProgress
    
    // Get total assignments
    const assignmentsSnapshot = await db.collection(collections.assignments).get()
    const totalAssignments = assignmentsSnapshot.size
    
    // Get total videos
    const videosSnapshot = await db.collection(collections.videos).get()
    const totalVideos = videosSnapshot.size
    
    // Calculate percentages
    const assignmentPercentage = totalAssignments > 0 
      ? (progress.assignmentsCompleted.length / totalAssignments) * 100 
      : 0
    
    const videoPercentage = totalVideos > 0
      ? (progress.videosWatched.length / totalVideos) * 100
      : 0
    
    // Overall completion (70% weight to assignments, 30% to videos)
    const overallPercentage = Math.round(
      (assignmentPercentage * 0.7) + (videoPercentage * 0.3)
    )
    
    // Update progress document
    await progressRef.update({
      overallCompletionPercentage: overallPercentage,
      currentWeek: Math.min(8, Math.ceil(progress.assignmentsCompleted.length || 1))
    })
    
    console.log(`[Progress Actions] Completion percentage: ${overallPercentage}%`)
    
    return {
      isSuccess: true,
      message: "Completion percentage calculated",
      data: overallPercentage
    }
  } catch (error) {
    console.error("[Progress Actions] Error calculating completion:", error)
    return { isSuccess: false, message: "Failed to calculate completion" }
  }
}

// Get student progress
export async function getStudentProgressAction(
  studentId: string
): Promise<ActionState<FirebaseProgress>> {
  console.log(`[Progress Actions] Getting progress for student: ${studentId}`)
  
  if (!db) {
    console.error("[Progress Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const progressDoc = await db
      .collection(collections.progress)
      .doc(studentId)
      .get()
    
    if (!progressDoc.exists) {
      console.log(`[Progress Actions] No progress found, creating new`)
      // Create initial progress
      const result = await updateProgressAction(studentId, {})
      return result
    }
    
    const progress = {
      ...progressDoc.data()
    } as FirebaseProgress
    
    console.log(`[Progress Actions] Retrieved progress successfully`)
    
    return {
      isSuccess: true,
      message: "Progress retrieved successfully",
      data: progress
    }
  } catch (error) {
    console.error("[Progress Actions] Error getting progress:", error)
    return { isSuccess: false, message: "Failed to get progress" }
  }
}

// Generate AI progress analysis
export async function generateProgressAnalysisAction(
  studentId: string
): Promise<ActionState<string>> {
  console.log(`[Progress Actions] Generating AI analysis for student: ${studentId}`)
  
  if (!db) {
    console.error("[Progress Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    // Get student progress
    const progressResult = await getStudentProgressAction(studentId)
    if (!progressResult.isSuccess || !progressResult.data) {
      return { isSuccess: false, message: "Failed to get student progress" }
    }
    
    const progress = progressResult.data
    
    // Check if we have a recent analysis (within 24 hours)
    const recentReport = progress.weeklyReports.find(report => {
      const reportDate = (report.generatedAt as any).toDate()
      const hoursSince = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60)
      return hoursSince < 24
    })
    
    if (recentReport) {
      console.log("[Progress Actions] Using cached analysis")
      return {
        isSuccess: true,
        message: "Progress analysis retrieved from cache",
        data: recentReport.report
      }
    }
    
    // Generate new analysis using Claude
    console.log("[Progress Actions] Generating new analysis with Claude")
    
    const prompt = `You are an AI tutor analyzing a student's progress in an entrepreneurship program. Generate a personalized progress report based on the following data:

Current Week: ${progress.currentWeek} of 8
Assignments Completed: ${progress.assignmentsCompleted.length}
Videos Watched: ${progress.videosWatched.length}
Overall Completion: ${progress.overallCompletionPercentage}%
Forum Activity:
- Posts Created: ${progress.forumStats.postsCreated}
- Replies: ${progress.forumStats.repliesCreated}
- Upvotes Received: ${progress.forumStats.upvotesReceived}

Generate a comprehensive progress report that includes:
1. Overall progress summary
2. Strengths and achievements
3. Areas for improvement
4. Specific recommendations for next steps
5. Encouragement and motivation

Keep the tone supportive, constructive, and personalized. The report should be 200-300 words.`
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{
          role: "user",
          content: prompt
        }],
        max_tokens: 1024,
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error("[Progress Actions] Claude API error:", error)
      return { isSuccess: false, message: "Failed to generate analysis" }
    }
    
    const data = await response.json()
    const analysis = data.content[0].text
    
    // Save the analysis
    const newReport: WeeklyReport = {
      weekNumber: progress.currentWeek,
      report: analysis,
      generatedAt: FieldValue.serverTimestamp() as unknown as Timestamp
    }
    
    await db.collection(collections.progress).doc(studentId).update({
      weeklyReports: FieldValue.arrayUnion(newReport)
    })
    
    console.log("[Progress Actions] Analysis generated and saved")
    
    return {
      isSuccess: true,
      message: "Progress analysis generated successfully",
      data: analysis
    }
  } catch (error) {
    console.error("[Progress Actions] Error generating analysis:", error)
    return { isSuccess: false, message: "Failed to generate progress analysis" }
  }
} 