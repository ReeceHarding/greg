"use server"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/firebase-auth"
import { isAdminEmailAction } from "@/actions/admin/admin-role-actions"
import AdminSessionsClient from "./_components/admin-sessions-client"
import AdminSessionsSkeleton from "./_components/admin-sessions-skeleton"
import { getAllLiveSessionsAction } from "@/actions/db/sessions-actions"

export default async function AdminSessionsPage() {
  console.log("[AdminSessionsPage] Checking admin authentication")
  
  const authResult = await auth()
  
  if (!authResult.user) {
    console.log("[AdminSessionsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }
  
  const adminCheck = await isAdminEmailAction(authResult.user.email || "")
  
  if (!adminCheck.isSuccess || !adminCheck.data) {
    console.log("[AdminSessionsPage] User is not admin, redirecting to dashboard")
    redirect("/dashboard")
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Live Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage live sessions, office hours, and workshops
        </p>
      </div>
      
      <Suspense fallback={<AdminSessionsSkeleton />}>
        <SessionsFetcher />
      </Suspense>
    </div>
  )
}

async function SessionsFetcher() {
  console.log("[SessionsFetcher] Fetching all sessions")
  
  const result = await getAllLiveSessionsAction()
  
  if (result.isSuccess && result.data) {
    console.log(`[SessionsFetcher] Loaded ${result.data.length} sessions`)
    return <AdminSessionsClient initialSessions={result.data} />
  }
  
  console.error("[SessionsFetcher] Failed to load sessions:", result.message)
  return (
    <div className="text-center py-8">
      <p className="text-destructive">Failed to load sessions: {result.message}</p>
    </div>
  )
} 