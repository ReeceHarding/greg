"use server"

import { Suspense } from "react"
import { getAssignmentsByWeekAction } from "@/actions/db/assignments-actions"
import { getStudentSubmissionForAssignmentAction } from "@/actions/db/submissions-actions"
import { auth } from "@/lib/firebase-auth"
import AssignmentDetailClient from "./_components/assignment-detail-client"
import AssignmentDetailSkeleton from "./_components/assignment-detail-skeleton"

interface AssignmentDetailPageProps {
  params: Promise<{ weekId: string }>
}

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { weekId } = await params
  const weekNumber = parseInt(weekId)
  
  console.log(`[AssignmentDetailPage] Loading week ${weekNumber} assignment`)
  
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 8) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-2xl font-semibold mb-2">Invalid Week</h2>
          <p className="text-muted-foreground">Please select a valid week (1-8).</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AssignmentDetailSkeleton />}>
        <AssignmentDetailFetcher weekNumber={weekNumber} />
      </Suspense>
    </div>
  )
}

async function AssignmentDetailFetcher({ weekNumber }: { weekNumber: number }) {
  console.log(`[AssignmentDetailFetcher] Fetching assignment for week ${weekNumber}`)
  
  // Get the current user
  const { userId, user } = await auth()
  
  if (!userId || !user) {
    console.error("[AssignmentDetailFetcher] No authenticated user")
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to view assignments.</p>
      </div>
    )
  }
  
  // Get assignments for this week
  const { data: assignments, isSuccess } = await getAssignmentsByWeekAction(weekNumber)
  
  if (!isSuccess || !assignments || assignments.length === 0) {
    console.error(`[AssignmentDetailFetcher] No assignments found for week ${weekNumber}`)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-2">Assignment Not Found</h2>
        <p className="text-muted-foreground">No assignment found for week {weekNumber}.</p>
      </div>
    )
  }
  
  // For now, we'll use the first assignment for the week
  const assignment = assignments[0]
  console.log(`[AssignmentDetailFetcher] Found assignment: ${assignment.title}`)
  
  // Check for existing submission
  const submissionResult = await getStudentSubmissionForAssignmentAction(userId, assignment.assignmentId)
  
  const existingSubmission = submissionResult.isSuccess ? submissionResult.data : null
  
  console.log(`[AssignmentDetailFetcher] Existing submission: ${existingSubmission ? 'Yes' : 'No'}`)
  
  return (
    <AssignmentDetailClient 
      assignment={assignment} 
      userId={userId}
      existingSubmission={existingSubmission}
    />
  )
} 