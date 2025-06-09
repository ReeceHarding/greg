"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getSubmissionAction } from "@/actions/db/submissions-actions"
import { getAssignmentAction } from "@/actions/db/assignments-actions"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import { getStudentProgressAction } from "@/actions/db/progress-actions"
import ReviewInterfaceClient from "./review-interface-client"

interface ReviewSubmissionPageProps {
  params: Promise<{ submissionId: string }>
}

export default async function ReviewSubmissionPage({ params }: ReviewSubmissionPageProps) {
  const { submissionId } = await params
  
  console.log(`[ReviewSubmissionPage] Loading submission: ${submissionId}`)
  
  const user = await auth()
  if (!user) {
    console.log("[ReviewSubmissionPage] No authenticated user, redirecting to login")
    redirect("/login")
  }
  
  // Fetch submission details
  const submissionResult = await getSubmissionAction(submissionId)
  if (!submissionResult.isSuccess || !submissionResult.data) {
    console.error("[ReviewSubmissionPage] Failed to load submission")
    redirect("/admin/reviews")
  }
  
  const submission = submissionResult.data
  
  // Fetch related data in parallel
  const [assignmentResult, profileResult, progressResult] = await Promise.all([
    getAssignmentAction(submission.assignmentId),
    getProfileByUserIdAction(submission.studentId),
    getStudentProgressAction(submission.studentId)
  ])
  
  const assignment = assignmentResult.isSuccess ? assignmentResult.data : null
  const studentProfile = profileResult.isSuccess ? profileResult.data : null
  const studentProgress = progressResult.isSuccess ? progressResult.data : null
  
  // Get previous submissions by this student
  const { getSubmissionsByStudentAction } = await import("@/actions/db/submissions-actions")
  const previousSubmissionsResult = await getSubmissionsByStudentAction(submission.studentId)
  const previousSubmissions = previousSubmissionsResult.isSuccess ? previousSubmissionsResult.data || [] : []
  
  console.log(`[ReviewSubmissionPage] Loaded submission with ${previousSubmissions.length} previous submissions`)
  
  return (
    <ReviewInterfaceClient
      submission={submission}
      assignment={assignment}
      studentProfile={studentProfile}
      studentProgress={studentProgress}
      previousSubmissions={previousSubmissions}
      reviewerId={user.userId || ''}
    />
  )
}
