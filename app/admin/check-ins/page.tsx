"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllSubmissionsAction } from "@/actions/db/submissions-actions"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import CheckInsReviewClient from "./check-ins-review-client"

export default async function AdminCheckInsPage() {
  console.log("[AdminCheckInsPage] Checking admin authentication")
  const user = await auth()
  if (!user) {
    console.log("[AdminCheckInsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[AdminCheckInsPage] Loading check-in submissions")
  
  // Fetch all submissions
  const submissionsResult = await getAllSubmissionsAction()
  const submissions = submissionsResult.isSuccess ? submissionsResult.data || [] : []
  
  // Fetch all assignments to get assignment details
  const assignmentsResult = await getAllAssignmentsAction()
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data || [] : []
  
  // Create assignment map for quick lookup
  const assignmentMap = new Map(
    assignments.map(a => [a.assignmentId, a])
  )
  
  // Filter submissions that have check-in responses and enrich with details
  const checkInSubmissions = await Promise.all(
    submissions
      .filter((submission: any) => {
        const content = submission.content || {}
        return !!(content.blockers || content.insights || content.improvements)
      })
      .map(async (submission: any) => {
        const profileResult = await getProfileByUserIdAction(submission.studentId)
        const profile = profileResult.isSuccess ? profileResult.data : null
        const assignment = assignmentMap.get(submission.assignmentId)
        
        return {
          ...submission,
          studentName: profile?.displayName || profile?.email || 'Unknown Student',
          studentEmail: profile?.email || '',
          assignmentTitle: assignment?.title || 'Unknown Assignment',
          weekNumber: assignment?.weekNumber || 0
        }
      })
  )
  
  console.log(`[AdminCheckInsPage] Loaded ${checkInSubmissions.length} check-in submissions`)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Weekly Check-ins</h1>
        <p className="text-muted-foreground">
          Review student check-in responses to understand their challenges and insights
        </p>
      </div>
      
      <CheckInsReviewClient submissions={checkInSubmissions} />
    </div>
  )
} 