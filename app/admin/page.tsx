"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  console.log("[AdminDashboard] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[AdminDashboard] No authenticated user, redirecting to login")
    redirect("/login")
  }

  // TODO: Check if user has admin role
  console.log("[AdminDashboard] Rendering admin dashboard for user:", user.userId)

  const stats = [
    { label: "Total Students", value: "247", change: "+12% from last week", trend: "up" },
    { label: "Active This Week", value: "189", change: "76.5% engagement", trend: "up" },
    { label: "Assignments Submitted", value: "134", change: "23 pending review", trend: "neutral" },
    { label: "Completion Rate", value: "68%", change: "+5% from last cohort", trend: "up" },
  ]

  const recentActivity = [
    { student: "Sarah Chen", action: "submitted Week 2 assignment", time: "5 minutes ago", type: "submission" },
    { student: "Mike Johnson", action: "completed all Week 1 videos", time: "1 hour ago", type: "progress" },
    { student: "Emily Davis", action: "joined the program", time: "2 hours ago", type: "new" },
    { student: "Alex Kumar", action: "requested help with assignment", time: "3 hours ago", type: "help" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Monitor student progress, manage content, and keep your cohort on track
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 p-8 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    stat.trend === "up" ? "bg-accent/10" : stat.trend === "down" ? "bg-destructive/10" : "bg-muted"
                  }`}>
                    {stat.trend === "up" ? (
                      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    ) : stat.trend === "down" ? (
                      <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border border-primary/20 p-10 mb-12">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 text-left group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Review Assignments</h3>
                <p className="text-sm text-muted-foreground mb-3">23 assignments pending your review</p>
                <span className="text-sm font-medium text-primary group-hover:underline">Review Now →</span>
              </button>

              <button className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 text-left group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Message Students</h3>
                <p className="text-sm text-muted-foreground mb-3">Send announcements or check in with students</p>
                <span className="text-sm font-medium text-primary group-hover:underline">Compose Message →</span>
              </button>

              <button className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 text-left group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Schedule Session</h3>
                <p className="text-sm text-muted-foreground mb-3">Plan your next live session or office hours</p>
                <span className="text-sm font-medium text-primary group-hover:underline">Schedule Now →</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/40 p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                View All Activity →
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/30 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.type === "submission" ? "bg-primary/10" :
                    activity.type === "progress" ? "bg-accent/10" :
                    activity.type === "new" ? "bg-blue-100" :
                    "bg-amber-100"
                  }`}>
                    {activity.type === "submission" && (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {activity.type === "progress" && (
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {activity.type === "new" && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    )}
                    {activity.type === "help" && (
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.student}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                  <button className="text-sm text-primary hover:text-primary/80 font-medium whitespace-nowrap">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk Students Alert */}
          <div className="mt-12 p-8 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">5 Students Need Attention</h3>
                <p className="text-muted-foreground mb-4">
                  These students haven't been active in over 5 days and may need additional support.
                </p>
                <button className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-medium transition-all duration-200">
                  View At-Risk Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 