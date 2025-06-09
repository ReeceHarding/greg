"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllProgressAction } from "@/actions/db/progress-actions"
import { getAllSubmissionsAction } from "@/actions/db/submissions-actions"
import { getAllProfilesAction } from "@/actions/db/profiles-actions"
import { getAllVideosAction } from "@/actions/videos/video-actions"
import AnalyticsDashboardClient from "./_components/analytics-dashboard-client"

export default async function AdminAnalyticsPage() {
  console.log("[AdminAnalyticsPage] Checking admin authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[AdminAnalyticsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }
  
  // TODO: Check admin role
  console.log("[AdminAnalyticsPage] Loading analytics data")
  
  // Fetch all necessary data in parallel
  const [progressResult, submissionsResult, profilesResult, videosResult] = await Promise.all([
    getAllProgressAction(),
    getAllSubmissionsAction(),
    getAllProfilesAction(),
    getAllVideosAction()
  ])
  
  const allProgress = progressResult.isSuccess ? progressResult.data || [] : []
  const allSubmissions = submissionsResult.isSuccess ? submissionsResult.data || [] : []
  const allProfiles = profilesResult.isSuccess ? profilesResult.data || [] : []
  const allVideos = videosResult.isSuccess ? videosResult.data || [] : []
  
  // Calculate key metrics
  const totalStudents = allProfiles.length
  const activeStudents = allProgress.filter(p => {
    const lastActive = p.lastCalculatedAt
    if (!lastActive) return false
    const daysSinceActive = Math.floor((Date.now() - new Date((lastActive as any).seconds * 1000).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceActive <= 7
  }).length
  
  const completedSubmissions = allSubmissions.filter(s => s.status === "approved").length
  const pendingSubmissions = allSubmissions.filter(s => s.status === "submitted" && !s.instructorFeedback).length
  
  const averageCompletion = allProgress.length > 0
    ? Math.round(allProgress.reduce((sum, p) => sum + p.overallCompletionPercentage, 0) / allProgress.length)
    : 0
  
  // Calculate engagement metrics
  const engagementData = {
    dailyActiveUsers: generateMockDailyData(30), // In real app, aggregate from logs
    assignmentsByWeek: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      completed: allSubmissions.filter(s => s.assignmentId.includes(`week-${i + 1}`) && s.status === "approved").length,
      submitted: allSubmissions.filter(s => s.assignmentId.includes(`week-${i + 1}`) && s.status === "submitted").length,
      total: allProfiles.length
    })),
    studentStatusDistribution: {
      active: activeStudents,
      inactive: totalStudents - activeStudents,
      atRisk: allProgress.filter(p => p.overallCompletionPercentage < 25).length
    },
    videoEngagement: allVideos.slice(0, 10).map(v => ({
      title: v.title,
      views: Math.floor(Math.random() * 100) + 20 // Mock data - in real app, track views
    }))
  }
  
  // Get at-risk students (no activity in 5+ days or low completion)
  const atRiskStudents = allProgress
    .filter(p => {
      const lastActive = p.lastCalculatedAt
      if (!lastActive) return true
      const daysSinceActive = Math.floor((Date.now() - new Date((lastActive as any).seconds * 1000).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceActive >= 5 || p.overallCompletionPercentage < 25
    })
    .map(p => {
      const profile = allProfiles.find(prof => prof.userId === p.studentId)
      return {
        studentId: p.studentId,
        name: profile?.displayName || profile?.email || "Unknown",
        email: profile?.email || "",
        completionRate: p.overallCompletionPercentage,
        lastActive: p.lastCalculatedAt ? new Date((p.lastCalculatedAt as any).seconds * 1000).toISOString() : null,
        currentWeek: p.currentWeek
      }
    })
  
  console.log("[AdminAnalyticsPage] Analytics data loaded")
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track student progress and program performance
        </p>
      </div>
      
      <AnalyticsDashboardClient
        totalStudents={totalStudents}
        activeStudents={activeStudents}
        completedSubmissions={completedSubmissions}
        pendingSubmissions={pendingSubmissions}
        averageCompletion={averageCompletion}
        engagementData={engagementData}
        atRiskStudents={atRiskStudents}
      />
    </div>
  )
}

// Helper function to generate mock daily data
function generateMockDailyData(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    return {
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 50) + 20
    }
  })
} 