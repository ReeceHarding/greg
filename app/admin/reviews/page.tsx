"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getPendingReviewSubmissionsAction, getSubmissionsByAssignmentAction } from "@/actions/db/submissions-actions"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import ReviewDashboardClient from "./review-dashboard-client"

export default async function AdminReviewsPage() {
  console.log("[AdminReviewsPage] Checking admin authentication")
  const user = await auth()
  if (!user) {
    console.log("[AdminReviewsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[AdminReviewsPage] Loading submissions for review")
  
  // Fetch all submissions that need review
  const pendingResult = await getPendingReviewSubmissionsAction()
  const pendingSubmissions = pendingResult.isSuccess ? pendingResult.data || [] : []
  
  // Fetch all assignments to get assignment details
  const assignmentsResult = await getAllAssignmentsAction()
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data || [] : []
  
  // Create assignment map for quick lookup
  const assignmentMap = new Map(
    assignments.map(a => [a.assignmentId, a])
  )
  
  // Fetch student profiles for each submission
  const submissionsWithDetails = await Promise.all(
    pendingSubmissions.map(async (submission) => {
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
  
  console.log(`[AdminReviewsPage] Loaded ${submissionsWithDetails.length} submissions for review`)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Review Submissions</h1>
        <p className="text-muted-foreground">
          Review and provide feedback on student assignment submissions
        </p>
      </div>
      
      <ReviewDashboardClient submissions={submissionsWithDetails} />
    </div>
  )
}
