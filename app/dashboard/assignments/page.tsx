"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function AssignmentsPage() {
  console.log("[AssignmentsPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[AssignmentsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[AssignmentsPage] Rendering assignments page for user:", user.userId)

  const weeks = [
    { id: "day1", title: "Day 1", theme: "Finding Your Niche", status: "not-started" },
    { id: "week1", title: "Week 1", theme: "Building an Audience", status: "not-started" },
    { id: "week2", title: "Week 2", theme: "Vibe Code MVP", status: "not-started" },
    { id: "week3-4", title: "Week 3-4", theme: "MVP Iteration", status: "locked" },
    { id: "week5-6", title: "Week 5-6", theme: "Marketing & Automation", status: "locked" },
    { id: "week7-8", title: "Week 7-8", theme: "Monetization", status: "locked" },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-foreground mb-2">Assignments</h1>
        <p className="text-lg text-muted-foreground">
          Complete weekly assignments to build your AI-powered business
        </p>
      </div>

      {/* Week Navigation */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {weeks.map((week) => (
            <button
              key={week.id}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                week.id === "week1"
                  ? "bg-primary text-primary-foreground"
                  : week.status === "locked"
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              disabled={week.status === "locked"}
            >
              <span className="flex items-center gap-2">
                {week.title}
                {week.status === "locked" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weeks.map((week) => (
          <div
            key={week.id}
            className={`group relative overflow-hidden rounded-lg border bg-card ${
              week.status === "locked"
                ? "border-muted opacity-60"
                : "border-border hover:shadow-lg transition-all duration-200 hover-lift"
            }`}
          >
            {/* Thumbnail placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary/30">{week.title}</span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-xl mb-2">{week.title}: {week.theme}</h3>
              
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-muted-foreground">0%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              {/* Due date */}
              <p className="text-sm text-muted-foreground mb-4">
                Due in 7 days
              </p>

              {/* Status badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  week.status === "locked"
                    ? "bg-muted text-muted-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {week.status === "locked" ? "Locked" : "Not Started"}
                </span>
              </div>

              {/* Action button */}
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  week.status === "locked"
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                disabled={week.status === "locked"}
              >
                {week.status === "locked" ? "Locked" : "Start Assignment"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 