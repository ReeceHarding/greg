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
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Your Progress
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Track your journey through AI Summer Camp and celebrate your achievements
            </p>
          </div>

          {/* Progress Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Overall Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 p-8 transition-all duration-300 hover:scale-[1.02]">
              <h3 className="font-semibold text-lg mb-4">Overall Progress</h3>
              <div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-2">25%</div>
                <p className="text-sm text-muted-foreground">Course completion</p>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000" style={{ width: "25%" }} />
              </div>
              <p className="mt-4 text-sm text-primary font-medium">
                Great start! Keep going 💪
              </p>
            </div>

            {/* Current Streak */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-accent/20 p-8 transition-all duration-300 hover:scale-[1.02]">
              <h3 className="font-semibold text-lg mb-4">Current Streak</h3>
              <div className="mb-6">
                <div className="text-5xl font-bold text-accent mb-2">7 days</div>
                <p className="text-sm text-muted-foreground">Keep it up!</p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={`flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                      day <= 7
                        ? "bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day <= 7 ? "✓" : day}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-accent font-medium">
                You're on fire! 🔥
              </p>
            </div>

            {/* Assignments Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 p-8 transition-all duration-300 hover:scale-[1.02]">
              <h3 className="font-semibold text-lg mb-4">Assignments</h3>
              <div className="mb-6">
                <div className="text-5xl font-bold mb-2">2/8</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-xl">
                  <span className="text-sm font-medium">Submitted</span>
                  <span className="text-sm font-bold text-accent">2</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm font-medium">Upcoming</span>
                  <span className="text-sm font-bold">5</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-10 mb-12">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  AI-Powered Insights
                </h3>
                <p className="text-muted-foreground">
                  Personalized feedback and recommendations based on your progress
                </p>
              </div>
              <button className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl text-sm text-primary hover:bg-white font-medium shadow-[0_4px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] transition-all duration-200">
                Refresh Insights
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Strengths
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="italic">AI insights will be available in Phase 4.</span> We'll analyze your progress to identify your unique strengths and provide personalized guidance to help you leverage them effectively.
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Growth Opportunities
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="italic">Coming soon!</span> Our AI will identify areas where you can improve and provide actionable steps to accelerate your learning journey.
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Progress Timeline */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/40 p-10">
            <h3 className="text-2xl font-bold mb-8">Your Learning Journey</h3>
            
            <div className="space-y-0">
              {[
                { week: "Day 1", title: "Finding Your Niche", status: "completed", date: "Completed Oct 15", videos: "5/5", assignment: "Submitted" },
                { week: "Week 1", title: "Building an Audience", status: "completed", date: "Completed Oct 22", videos: "6/6", assignment: "Submitted" },
                { week: "Week 2", title: "Vibe Code MVP", status: "in-progress", date: "Due Oct 29", videos: "3/7", assignment: "In Progress" },
                { week: "Week 3-4", title: "MVP Iteration", status: "upcoming", date: "Starts Nov 5", videos: "0/10", assignment: "Not Started" },
                { week: "Week 5-6", title: "Marketing & Automation", status: "locked", date: "Starts Nov 19", videos: "0/12", assignment: "Locked" },
                { week: "Week 7-8", title: "Monetization", status: "locked", date: "Starts Dec 3", videos: "0/8", assignment: "Locked" },
              ].map((item, index) => (
                <div key={item.week} className="relative">
                  {/* Connection Line */}
                  {index < 5 && (
                    <div className={`absolute left-7 top-20 w-0.5 h-24 ${
                      index < 2 ? "bg-accent" : "bg-border"
                    }`} />
                  )}
                  
                  {/* Timeline Item */}
                  <div className="flex gap-6 items-start p-6 rounded-2xl hover:bg-muted/30 transition-all duration-200">
                    {/* Status Indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                        item.status === "completed"
                          ? "bg-accent text-accent-foreground"
                          : item.status === "in-progress"
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : item.status === "upcoming"
                          ? "bg-white border-2 border-primary text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {item.status === "completed" ? (
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : item.status === "in-progress" ? (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold mb-1">{item.week}</h4>
                          <p className="text-lg font-medium text-primary">{item.title}</p>
                        </div>
                        <span className={`text-sm font-medium ${
                          item.status === "completed" ? "text-accent" :
                          item.status === "in-progress" ? "text-primary" :
                          "text-muted-foreground"
                        }`}>
                          {item.date}
                        </span>
                      </div>
                      
                      {item.status !== "locked" && (
                        <div className="flex gap-4 mt-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium">Videos: {item.videos}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium">Assignment: {item.assignment}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Section */}
          <div className="mt-12 text-center p-10 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">You're doing amazing! 🎉</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              You've completed 25% of the program and maintained a 7-day streak. Keep up this momentum and you'll be launching your AI business in no time!
            </p>
            <button className="mt-6 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-full font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200">
              Continue to Next Assignment
            </button>
          </div>
        </div>
      </section>
    </div>
  )
} 