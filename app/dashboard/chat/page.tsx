"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  console.log("[ChatPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[ChatPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[ChatPage] Rendering chat page for user:", user.userId)

  return (
    <div className="container mx-auto h-[calc(100vh-120px)] py-8 px-4">
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-h1 font-bold text-foreground mb-2">AI Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Ask questions about videos, assignments, or entrepreneurship
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              {/* Welcome message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-secondary rounded-lg p-4 max-w-2xl">
                    <p className="font-medium mb-2">Welcome to AI Summer Camp! 👋</p>
                    <p className="text-muted-foreground">
                      I'm your AI assistant powered by Claude. I can help you with:
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Understanding video content and finding specific timestamps</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Clarifying assignment requirements and getting feedback</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Answering questions about entrepreneurship and AI</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Providing guidance on your startup journey</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-4">
              <textarea
                placeholder="Ask me anything about the videos, assignments, or building your startup..."
                className="flex-1 min-h-[60px] max-h-[120px] px-4 py-3 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={1}
              />
              <button
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                disabled
              >
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              AI features will be enabled in Phase 4
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 