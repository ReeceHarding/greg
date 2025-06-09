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

        {/* Chat Container */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
              {/* Welcome message */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-6 max-w-2xl border border-primary/20">
                    <p className="font-semibold text-lg mb-3">Welcome to Your AI Assistant! 👋</p>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      I'm here to help you succeed in the AI Summer Camp. I'm powered by Claude and can assist you with:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Video Content</p>
                          <p className="text-xs text-muted-foreground">Find specific timestamps and key insights</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Assignments</p>
                          <p className="text-xs text-muted-foreground">Get clarity on requirements and feedback</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Business Strategy</p>
                          <p className="text-xs text-muted-foreground">Get personalized advice for your startup</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Technical Help</p>
                          <p className="text-xs text-muted-foreground">Debug code and solve technical challenges</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Questions */}
              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground mb-4">Try asking:</p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200">
                    What's the best way to find my first 100 customers?
                  </button>
                  <button className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200">
                    How do I price my AI product?
                  </button>
                  <button className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200">
                    Show me examples of successful MVPs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/40 p-6 bg-gradient-to-t from-muted/5 to-transparent">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    placeholder="Ask me anything about videos, assignments, or building your AI business..."
                    className="w-full min-h-[60px] max-h-[120px] px-6 py-4 pr-16 bg-white border border-border/40 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                    rows={1}
                  />
                  <button
                    className="absolute right-3 bottom-3 p-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
                <button
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-2xl font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <span>Send Message</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  AI features will be fully activated in Phase 4
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Powered by Claude 4 Sonnet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 