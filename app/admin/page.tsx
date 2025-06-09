"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"

export default async function AdminOverviewPage() {
  console.log("[AdminOverviewPage] Checking admin authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[AdminOverviewPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[AdminOverviewPage] Rendering overview for user:", user.userId)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the AI Summer Camp admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-foreground">48</p>
          <p className="text-sm text-accent mt-2">+12% from last week</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Now</h3>
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-foreground">12</p>
          <p className="text-sm text-muted-foreground mt-2">Currently online</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Submissions</h3>
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-foreground">186</p>
          <p className="text-sm text-primary mt-2">8 pending review</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-foreground">73%</p>
          <p className="text-sm text-accent mt-2">Above average</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">JS</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">John Smith</p>
                    <p className="text-xs text-muted-foreground">Week 2 Assignment</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Pending Review
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
          <div className="space-y-4">
            {[
              { title: "Office Hours", time: "Today, 2:00 PM EST", attendees: 15 },
              { title: "Week 3 Kickoff", time: "Tomorrow, 10:00 AM EST", attendees: 42 },
              { title: "Guest Speaker: AI in 2025", time: "Friday, 3:00 PM EST", attendees: 38 },
            ].map((session, i) => (
              <div key={i} className="py-3 border-b border-border last:border-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{session.time}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {session.attendees} attending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 