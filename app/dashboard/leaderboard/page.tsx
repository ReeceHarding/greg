"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllProgressAction } from "@/actions/db/progress-actions"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import LeaderboardClient from "./_components/leaderboard-client"

export default async function LeaderboardPage() {
  console.log("[LeaderboardPage] Checking authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[LeaderboardPage] No authenticated user, redirecting to login")
    redirect("/login")
  }
  
  console.log("[LeaderboardPage] Loading leaderboard data")
  
  // Get all student progress
  const progressResult = await getAllProgressAction()
  const allProgress = progressResult.isSuccess ? progressResult.data || [] : []
  
  // Get profiles for each student
  const leaderboardData = await Promise.all(
    allProgress.map(async (progress) => {
      const profileResult = await getProfileByUserIdAction(progress.studentId)
      const profile = profileResult.isSuccess ? profileResult.data : null
      
      return {
        studentId: progress.studentId,
        displayName: profile?.displayName || profile?.email || "Anonymous",
        photoURL: profile?.photoURL || null,
        email: profile?.email || "",
        totalPoints: progress.totalPoints || 0,
        currentStreak: progress.currentStreak || 0,
        assignmentsCompleted: progress.assignmentsCompleted.length,
        badges: progress.badges || [],
        lastActiveAt: progress.lastCalculatedAt 
          ? (progress.lastCalculatedAt instanceof Date 
            ? progress.lastCalculatedAt.toISOString() 
            : typeof progress.lastCalculatedAt === 'string' 
              ? progress.lastCalculatedAt 
              : null)
          : null
      }
    })
  )
  
  // Sort by total points (descending)
  const sortedLeaderboard = leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints)
  
  console.log(`[LeaderboardPage] Loaded ${sortedLeaderboard.length} students for leaderboard`)
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank against other students in the program
        </p>
      </div>
      
      <LeaderboardClient 
        leaderboardData={sortedLeaderboard}
        currentUserId={user.userId || ''}
      />
    </div>
  )
} 