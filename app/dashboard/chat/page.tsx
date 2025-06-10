"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import ChatPageWrapper from "./_components/chat-page-wrapper"

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
      {/* Chat Container with History Sidebar */}
      <ChatPageWrapper userId={user.userId} />
    </div>
  )
} 