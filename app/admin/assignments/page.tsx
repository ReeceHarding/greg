"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function AdminAssignmentsPage() {
  const user = await auth()
  if (!user) redirect("/login")

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Assignments</h1>
        <p className="text-muted-foreground">Review and grade student submissions</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Assignment review interface will be implemented in Phase 5</p>
      </div>
    </div>
  )
} 