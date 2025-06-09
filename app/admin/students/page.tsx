"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function AdminStudentsPage() {
  console.log("[AdminStudentsPage] Checking admin authentication")
  const user = await auth()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Students</h1>
        <p className="text-muted-foreground">
          Manage and monitor student progress
        </p>
      </div>

      {/* Placeholder content */}
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Student management interface will be implemented in Phase 5
        </p>
      </div>
    </div>
  )
} 