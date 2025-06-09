"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import ChatClient from "./_components/chat-client"

export default async function ChatPage() {
  console.log("[ChatPage] Checking authentication")
  const user = await auth()
  
  if (!user || !user.userId) {
    console.log("[ChatPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[ChatPage] Rendering chat page for user:", user.userId)

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-6xl h-screen flex flex-col py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            AI Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            Get instant help with videos, assignments, and building your business
          </p>
        </div>

        {/* Chat Container - Now using the client component */}
        <ChatClient userId={user.userId} />
      </div>
    </div>
  )
} 