"use server"

import { Suspense } from "react"
import { getAllLiveSessionsAction } from "@/actions/db/sessions-actions"
import SessionsClient from "./_components/sessions-client"
import SessionsSkeleton from "./_components/sessions-skeleton"

export default async function SessionsPage() {
  console.log("[SessionsPage] Loading sessions page")
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Live Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Join live office hours and expert workshops to accelerate your learning
        </p>
      </div>
      
      <Suspense fallback={<SessionsSkeleton />}>
        <SessionsFetcher />
      </Suspense>
    </div>
  )
}

async function SessionsFetcher() {
  console.log("[SessionsFetcher] Fetching live sessions")
  
  const { data: sessions, isSuccess } = await getAllLiveSessionsAction()
  
  if (!isSuccess || !sessions) {
    console.error("[SessionsFetcher] Failed to load sessions")
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load sessions. Please try again later.</p>
      </div>
    )
  }
  
  console.log(`[SessionsFetcher] Loaded ${sessions.length} sessions`)
  
  return <SessionsClient sessions={sessions} />
} 