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
    <div className="h-screen bg-white flex">
      {/* Chat Container - Full screen without header */}
      <ChatClient userId={user.userId} />
    </div>
  )
} 