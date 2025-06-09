"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getAllSubmissionsAction } from "@/actions/db/submissions-actions"
import { getAllProfilesAction } from "@/actions/db/profiles-actions"
import AssignmentsManagementClient from "./_components/assignments-management-client"

export default async function AdminAssignmentsPage() {
  console.log("[Admin Assignments Page] Checking authentication")
  
  const authResult = await auth()
  if (!authResult.user || authResult.user.customClaims?.role !== "admin") {
    console.log("[Admin Assignments Page] Unauthorized access")
    redirect("/")
  }
  
  console.log("[Admin Assignments Page] Fetching data")
  const [assignmentsResult, submissionsResult, profilesResult] = await Promise.all([
    getAllAssignmentsAction(),
    getAllSubmissionsAction(),
    getAllProfilesAction()
  ])
  
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data : []
  const submissions = submissionsResult.isSuccess ? submissionsResult.data : []
  const profiles = profilesResult.isSuccess ? profilesResult.data : []
  
  console.log(`[Admin Assignments Page] Found ${assignments.length} assignments, ${submissions.length} submissions, ${profiles.length} students`)
  
  // Calculate statistics for each assignment
  const assignmentStats = assignments.map(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.assignmentId)
    const completedCount = assignmentSubmissions.filter(s => s.status === "approved").length
    const pendingCount = assignmentSubmissions.filter(s => s.status === "submitted").length
    const needsRevisionCount = assignmentSubmissions.filter(s => s.status === "needs_revision").length
    
    return {
      assignmentId: assignment.assignmentId,
      totalStudents: profiles.length,
      completedCount,
      pendingCount,
      needsRevisionCount,
      completionRate: profiles.length > 0 ? Math.round((completedCount / profiles.length) * 100) : 0
    }
  })
  
  // Serialize assignments for client component
  const serializedAssignments = assignments.map(assignment => ({
    ...assignment,
    dueDate: assignment.dueDate instanceof Date ? assignment.dueDate.toISOString() : assignment.dueDate.toDate().toISOString(),
    createdAt: assignment.createdAt instanceof Date ? assignment.createdAt.toISOString() : assignment.createdAt.toDate().toISOString(),
    updatedAt: assignment.updatedAt instanceof Date ? assignment.updatedAt.toISOString() : assignment.updatedAt.toDate().toISOString(),
  }))
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Assignment Management</h1>
        <p className="text-muted-foreground text-sm">Create and manage assignments for all weeks</p>
      </div>
      
      <AssignmentsManagementClient 
        initialAssignments={serializedAssignments}
        assignmentStats={assignmentStats}
      />
    </div>
  )
} 