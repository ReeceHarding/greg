"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import AssignmentsManagementClient from "./_components/assignments-management-client"

export default async function AdminAssignmentsPage() {
  console.log("[Admin Assignments Page] Checking authentication")
  
  const authResult = await auth()
  if (!authResult.user || authResult.user.customClaims?.role !== "admin") {
    console.log("[Admin Assignments Page] Unauthorized access")
    redirect("/")
  }
  
  console.log("[Admin Assignments Page] Fetching all assignments")
  const assignmentsResult = await getAllAssignmentsAction()
  
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data : []
  console.log(`[Admin Assignments Page] Found ${assignments.length} assignments`)
  
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
        <h1 className="text-3xl font-bold mb-2">Assignment Management</h1>
        <p className="text-muted-foreground">Create and manage assignments for all weeks</p>
      </div>
      
      <AssignmentsManagementClient 
        initialAssignments={serializedAssignments}
      />
    </div>
  )
} 