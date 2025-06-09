"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function ProgressPage() {
  console.log("[ProgressPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[ProgressPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[ProgressPage] Rendering progress page for user:", user.userId)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-foreground mb-2">Your Progress</h1>
        <p className="text-lg text-muted-foreground">
          Track your journey through AI Summer Camp
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Overall Progress</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-primary">15%</div>
            <p className="text-sm text-muted-foreground">Course completion</p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "15%" }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Current Streak</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-accent">3 days</div>
            <p className="text-sm text-muted-foreground">Keep it up!</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                  day <= 3
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Assignments</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold">1/8</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Submitted</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>In Progress</span>
              <span className="font-medium">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section (placeholder) */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Personalized feedback and recommendations
            </p>
          </div>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-muted-foreground italic">
              AI insights will be available in Phase 4. This will include personalized progress analysis,
              strengths identification, and custom recommendations based on your learning journey.
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Progress Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-6">Weekly Progress</h3>
        
        <div className="space-y-6">
          {["Day 1", "Week 1", "Week 2", "Week 3-4", "Week 5-6", "Week 7-8"].map((week, index) => (
            <div key={week} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  index === 0
                    ? "bg-accent text-accent-foreground"
                    : index === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {index === 0 ? "✓" : index + 1}
                </div>
                {index < 5 && (
                  <div className={`w-0.5 h-16 ${
                    index === 0 ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
              
              <div className="flex-1 pb-8">
                <h4 className="font-medium text-lg mb-1">{week}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {index === 0 && "Finding Your Niche - Completed"}
                  {index === 1 && "Building an Audience - In Progress"}
                  {index === 2 && "Vibe Code MVP - Not Started"}
                  {index === 3 && "MVP Iteration - Locked"}
                  {index === 4 && "Marketing & Automation - Locked"}
                  {index === 5 && "Monetization - Locked"}
                </p>
                {index < 2 && (
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-secondary rounded-md">
                      Videos: {index === 0 ? "5/5" : "2/6"}
                    </span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-md">
                      Assignment: {index === 0 ? "Submitted" : "In Progress"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 