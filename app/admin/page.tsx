"use server"

import Link from "next/link"
import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllProfilesAction } from "@/actions/db/profiles-actions"
import { getAllSubmissionsAction } from "@/actions/db/submissions-actions"
import { getAllProgressAction } from "@/actions/db/progress-actions"

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

export default async function AdminDashboard() {
  console.log("[AdminDashboard] Checking admin authentication")
  const authResult = await auth()
  
  if (!authResult.user || authResult.user.customClaims?.role !== "admin") {
    console.log("[AdminDashboard] User is not admin, redirecting")
    redirect("/")
  }

  console.log("[AdminDashboard] Fetching dashboard data")
  
  // Fetch all data needed for the dashboard
  const [profilesResult, submissionsResult, progressResult] = await Promise.all([
    getAllProfilesAction(),
    getAllSubmissionsAction(),
    getAllProgressAction()
  ])
  
  const profiles = profilesResult.isSuccess ? profilesResult.data : []
  const submissions = submissionsResult.isSuccess ? submissionsResult.data : []
  const progress = progressResult.isSuccess ? progressResult.data : []
  
  console.log("[AdminDashboard] Data fetched - profiles:", profiles.length, "submissions:", submissions.length)
  
  // Calculate real stats
  const students = profiles.filter(p => p.email !== authResult.user!.email) // Exclude current admin
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Active students (those with progress in the last week)
  const activeStudentIds = new Set(
    progress
      .filter(p => {
        const lastActive = p.lastCalculatedAt instanceof Date ? p.lastCalculatedAt : 
                          (p.lastCalculatedAt as any)?.toDate ? (p.lastCalculatedAt as any).toDate() :
                          new Date(0)
        return lastActive > oneWeekAgo
      })
      .map(p => p.studentId)
  )
  
  const activeStudents = activeStudentIds.size
  const pendingSubmissions = submissions.filter(s => s.status === "submitted").length
  
  // Calculate average completion rate
  const studentProgress = progress.filter(p => p.studentId !== authResult.user!.uid)
  const totalProgress = studentProgress.reduce((sum, p) => {
    return sum + (p.overallCompletionPercentage || 0)
  }, 0)
  const avgCompletionRate = studentProgress.length > 0 ? Math.round(totalProgress / studentProgress.length) : 0
  
  // Recent activity
  const recentSubmissions = submissions
    .sort((a, b) => {
      const dateA = a.submittedAt instanceof Date ? a.submittedAt : 
                    (a.submittedAt as any)?.toDate ? (a.submittedAt as any).toDate() : new Date(0)
      const dateB = b.submittedAt instanceof Date ? b.submittedAt : 
                    (b.submittedAt as any)?.toDate ? (b.submittedAt as any).toDate() : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)
  
  // At-risk students (no activity in 5+ days)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const atRiskCount = students.length - Array.from(activeStudentIds).filter(id => {
    const studentProgress = progress.find(p => p.studentId === id)
    if (!studentProgress) return false
    const lastActive = studentProgress.lastCalculatedAt instanceof Date ? studentProgress.lastCalculatedAt : 
                      (studentProgress.lastCalculatedAt as any)?.toDate ? (studentProgress.lastCalculatedAt as any).toDate() :
                      new Date(0)
    return lastActive > fiveDaysAgo
  }).length

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
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 p-8 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{students.length}</h3>
                <p className="text-sm text-muted-foreground">All registered students</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 p-8 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Active This Week</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{activeStudents}</h3>
                <p className="text-sm text-muted-foreground">
                  {students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0}% engagement
                </p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 p-8 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Assignments Submitted</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{submissions.length}</h3>
                <p className="text-sm text-muted-foreground">{pendingSubmissions} pending review</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border/40 hover:border-primary/30 p-8 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{avgCompletionRate}%</h3>
                <p className="text-sm text-muted-foreground">Average progress</p>
              </div>
            </div>
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
              {recentSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : (
                recentSubmissions.map((submission) => {
                  const student = profiles.find(p => p.userId === submission.studentId)
                  const submittedAt = submission.submittedAt instanceof Date ? submission.submittedAt : 
                                    (submission.submittedAt as any)?.toDate ? (submission.submittedAt as any).toDate() : 
                                    new Date()
                  
                  return (
                    <div
                      key={submission.submissionId}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/30 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {student?.displayName || student?.email || "Unknown Student"}
                          </span>
                          <span className="text-muted-foreground"> submitted an assignment</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(submittedAt)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/reviews/${submission.submissionId}`}
                        className="text-sm text-primary hover:text-primary/80 font-medium whitespace-nowrap"
                      >
                        Review
                      </Link>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* At-Risk Students Alert */}
          {atRiskCount > 0 && (
            <div className="mt-12 p-8 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl border border-amber-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{atRiskCount} Students Need Attention</h3>
                  <p className="text-muted-foreground mb-4">
                    These students haven't been active in over 5 days and may need additional support.
                  </p>
                  <Link
                    href="/admin/students?filter=at-risk"
                    className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-medium transition-all duration-200"
                  >
                    View At-Risk Students
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
} 