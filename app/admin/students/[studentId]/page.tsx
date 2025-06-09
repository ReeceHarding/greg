"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import { getStudentProgressAction } from "@/actions/db/progress-actions"
import { getSubmissionsByStudentAction } from "@/actions/db/submissions-actions"
import StudentDetailsClient from "./_components/student-details-client"

interface StudentDetailsPageProps {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  console.log("[Student Details Page] Checking authentication")
  const authResult = await auth()
  
  if (!authResult.user || authResult.user.customClaims?.role !== "admin") {
    console.log("[Student Details Page] Unauthorized access")
    redirect("/")
  }

  const { studentId } = await params
  console.log("[Student Details Page] Fetching details for student:", studentId)
  
  // Fetch student data in parallel
  const [profileResult, progressResult, submissionsResult] = await Promise.all([
    getProfileByUserIdAction(studentId),
    getStudentProgressAction(studentId),
    getSubmissionsByStudentAction(studentId)
  ])
  
  if (!profileResult.isSuccess || !profileResult.data) {
    console.log("[Student Details Page] Student not found:", studentId)
    redirect("/admin/students")
  }

  const profile = profileResult.data
  const progress = progressResult.isSuccess ? progressResult.data : null
  const submissions = submissionsResult.isSuccess ? submissionsResult.data : []

  console.log(`[Student Details Page] Loaded data - Submissions: ${submissions.length}`)

  return (
    <div className="p-6">
      <StudentDetailsClient 
        profile={profile}
        progress={progress}
        submissions={submissions || []}
      />
    </div>
  )
} 