/*
<ai_context>
This server page displays the main dashboard with user stats and quick actions.
It uses Firebase Auth and Firestore to get user data.
</ai_context>
*/

"use server"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/firebase-auth"
import {
  getProfileByUserIdAction,
  createProfileAction
} from "@/actions/db/profiles-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  CreditCard,
  User,
  Settings,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Zap,
  Users,
  ShoppingCart,
  FolderOpen,
  ArrowRight
} from "lucide-react"
import FirestoreSetupNotice from "@/components/utilities/firestore-setup-notice"
import { adminAuth } from "@/lib/firebase-config"
import { getStudentProgressAction } from "@/actions/db/progress-actions"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getSubmissionsByStudentAction } from "@/actions/db/submissions-actions"
import { getAllVideosAction } from "@/actions/videos/video-actions"

async function DashboardContent() {
  console.log("[Dashboard Page] Checking authentication")
  const { userId } = await auth()

  if (!userId) {
    console.log("[Dashboard Page] No user found, redirecting to login")
    redirect("/login")
  }

  console.log("[Dashboard Page] Fetching profile for user:", userId)
  let profileResult = await getProfileByUserIdAction(userId)

  // Check if Firestore is not enabled
  if (
    !profileResult.isSuccess &&
    profileResult.message.includes("collection may not exist yet")
  ) {
    console.log(
      "[Dashboard Page] Firestore might not be enabled, attempting to create profile"
    )
  }

  // If profile doesn't exist, create one
  if (!profileResult.isSuccess) {
    console.log("[Dashboard Page] Profile not found, creating new profile")

    // Get user data from auth
    const authResult = await auth()
    const user = authResult.user

    // Get full user record from Firebase Admin to get photo URL
    let photoURL = ""
    let displayName = ""
    
    try {
      if (adminAuth && userId) {
        const userRecord = await adminAuth.getUser(userId)
        photoURL = userRecord.photoURL || ""
        displayName = userRecord.displayName || userRecord.email?.split("@")[0] || "User"
        console.log("[Dashboard Page] Got user photo URL:", photoURL ? "Yes" : "No")
      }
    } catch (error) {
      console.error("[Dashboard Page] Error getting user record:", error)
    }
    
    // Create profile with available data
    const role = authResult.role || "student"
    const email = user?.email || ""
    
    if (!displayName) {
      displayName = email.split("@")[0] || "User"
    }

    profileResult = await createProfileAction({
      userId: userId,
      email: email,
      displayName: displayName,
      photoURL: photoURL,
      membership: "free"
    })

    if (!profileResult.isSuccess) {
      console.error(
        "[Dashboard Page] Failed to create profile:",
        profileResult.message
      )

      // Check if it's a Firestore not enabled error
      if (profileResult.message.includes("Firestore is not enabled")) {
        console.log("[Dashboard Page] Showing Firestore setup notice")
        return <FirestoreSetupNotice />
      }
    } else {
      console.log("[Dashboard Page] Profile created successfully")
    }
  }

  const profile = profileResult.isSuccess ? profileResult.data : null

  // Fetch real data
  const [progressResult, assignmentsResult, submissionsResult, videosResult] = await Promise.all([
    getStudentProgressAction(userId),
    getAllAssignmentsAction(),
    getSubmissionsByStudentAction(userId),
    getAllVideosAction()
  ])

  const progress = progressResult.isSuccess ? progressResult.data : null
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data : []
  const submissions = submissionsResult.isSuccess ? submissionsResult.data : []
  const videos = videosResult.isSuccess ? videosResult.data : []

  // Calculate real stats
  const completedSubmissions = submissions.filter(s => s.status === "approved").length
  const pendingSubmissions = submissions.filter(s => s.status === "submitted" && !s.instructorFeedback).length
  const totalAssignments = assignments.length
  const completionRate = totalAssignments > 0 ? Math.round((completedSubmissions / totalAssignments) * 100) : 0
  
  // Get videos watched from progress
  const videosWatched = progress?.videosWatched?.length || 0
  const totalVideos = videos.length
  const videoProgress = totalVideos > 0 ? Math.round((videosWatched / totalVideos) * 100) : 0

  const stats = [
    {
      title: "Check-in Progress",
      value: `${completedSubmissions}/${totalAssignments}`,
      change: `${completionRate}%`,
      changeType: "positive" as const,
      icon: FolderOpen,
      description: "completed",
      trend: [] // Could calculate weekly trend if we track submission dates
    },
    {
      title: "Videos Watched",
      value: `${videosWatched}`,
      change: `${videoProgress}%`,
      changeType: "positive" as const,
      icon: Activity,
      description: `of ${totalVideos} total`,
      trend: []
    },
    {
      title: "Current Week",
      value: `Week ${progress?.currentWeek || 1}`,
      change: progress?.currentStreak ? `${progress.currentStreak} day streak` : "Start today",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "of 8 weeks",
      trend: []
    },
    {
      title: "Total Points",
      value: progress?.totalPoints?.toLocaleString() || "0",
      change: "+0",
      changeType: "positive" as const,
      icon: Zap,
      description: "points earned",
      trend: []
    }
  ]

  const quickActions = [
    {
      title: "Manage Subscription",
      description: "View and update your billing information",
      icon: CreditCard,
      href: "/dashboard/billing",
      actionText: "Manage billing"
    },
    {
      title: "Edit Profile",
      description: "Update your personal information and preferences",
      icon: User,
      href: "/dashboard/profile",
      actionText: "Update profile"
    },
    {
      title: "Account Settings",
      description: "Configure security and notification preferences",
      icon: Settings,
      href: "/dashboard/settings",
      actionText: "Open settings"
    }
  ]

  const recentActivities = submissions
    .sort((a, b) => {
      const dateA = a.submittedAt instanceof Date ? a.submittedAt : 
                    typeof a.submittedAt === 'string' ? new Date(a.submittedAt) : 
                    a.submittedAt ? new Date(a.submittedAt.seconds * 1000) : new Date(0)
      const dateB = b.submittedAt instanceof Date ? b.submittedAt : 
                    typeof b.submittedAt === 'string' ? new Date(b.submittedAt) : 
                    b.submittedAt ? new Date(b.submittedAt.seconds * 1000) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 3)
    .map(submission => {
      const assignment = assignments.find(a => a.assignmentId === submission.assignmentId)
      const submittedAt = submission.submittedAt instanceof Date ? submission.submittedAt : 
                         typeof submission.submittedAt === 'string' ? new Date(submission.submittedAt) : 
                         submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000) : new Date()
      
      return {
        title: assignment?.title || `Week ${submission.assignmentId.replace('week-', '')} Check-in`,
        description: submission.status === "approved" ? "Check-in approved!" :
                     submission.status === "needs_revision" ? "Needs revision" :
                     "Submitted for review",
        time: submittedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    })
  
  // If no submissions, show placeholder activities
  if (recentActivities.length === 0) {
    recentActivities.push(
      {
        title: "Welcome to AI Summer Camp!",
        description: "Start your first check-in",
        time: "Now"
      },
      {
        title: "Watch Introduction Videos",
        description: "Learn the basics to get started",
        time: "Today"
      },
      {
        title: "Join the Community",
        description: "Connect with other students",
        time: "Anytime"
      }
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Welcome Section - Modern and sleek with blue theme */}
      <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-blue-600 to-blue-500 p-8 shadow-lg">
        <div className="relative">
          <h1 className="mb-2 text-3xl font-semibold text-white">
            Welcome back, {profile?.displayName || "Entrepreneur"}!
          </h1>
          <p className="mb-6 text-blue-100">
            Your entrepreneurship dashboard is ready. Time to build something amazing.
          </p>
          <Button
            size="default"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            asChild
          >
            <Link href="/dashboard/assignments">
              Continue Building
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Stats Grid - Following the metric card pattern from the guide with blue theme */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="group relative rounded-2xl border border-blue-100/20 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </h3>
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20">
                <stat.icon className="size-5 text-white" />
              </div>
            </div>

            <div className="mb-3">
              <span className="font-instrument bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
                {stat.value}
              </span>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div
                className={`flex items-center gap-1 ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="size-4" />
                ) : (
                  <ArrowDownRight className="size-4" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {stat.description}
              </span>
            </div>

            {/* Mini trend graph placeholder */}
            <div className="flex h-12 items-end justify-between gap-1">
              {stat.trend.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-blue-200/50"
                  style={{
                    height: `${(value / Math.max(...stat.trend)) * 100}%`,
                    opacity: i === stat.trend.length - 1 ? 1 : 0.6
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Enhanced with better visual hierarchy and entrepreneurship focus */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-instrument text-2xl font-semibold">
              Take Action
            </h2>
            <p className="text-muted-foreground mt-1">
              Build your business step by step
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/dashboard/assignments">
            <Card className="group h-full cursor-pointer border-blue-100/20 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                    <FolderOpen className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg font-semibold transition-colors group-hover:text-blue-600">
                      Weekly Check-ins
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Submit your progress and get feedback
                    </CardDescription>
                    <div className="pt-2">
                      <span className="inline-flex items-center text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
                        {pendingSubmissions > 0 ? "Submit this week's progress" : "View assignments"}
                        <ArrowUpRight className="ml-1 size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/videos">
            <Card className="group h-full cursor-pointer border-blue-100/20 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                    <Activity className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg font-semibold transition-colors group-hover:text-blue-600">
                      Business Training
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Watch Greg's entrepreneurship videos
                    </CardDescription>
                    <div className="pt-2">
                      <span className="inline-flex items-center text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
                        Continue watching
                        <ArrowUpRight className="ml-1 size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/chat">
            <Card className="group h-full cursor-pointer border-blue-100/20 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                    <Zap className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg font-semibold transition-colors group-hover:text-blue-600">
                      AI Business Coach
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Get instant help building your business
                    </CardDescription>
                    <div className="pt-2">
                      <span className="inline-flex items-center text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
                        Ask a question
                        <ArrowUpRight className="ml-1 size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Project Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">
                Total Check-ins
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-instrument text-3xl font-bold text-blue-600">
                  {submissions.length}
                </span>
                <span className="text-sm font-medium text-green-600">
                  {pendingSubmissions > 0 ? `${pendingSubmissions} pending` : "All reviewed"}
                </span>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-blue-600 bg-white shadow-sm">
              <FolderOpen className="size-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Updated with entrepreneurship focus */}
        <Card className="relative overflow-hidden border-gray-200 bg-white">
          <div className="absolute right-0 top-0 size-40 bg-blue-50/30 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold text-black">
              Your Progress
            </CardTitle>
            <CardDescription className="text-gray-600">
              Recent milestones and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5">
                  <div className="size-2 animate-pulse rounded-full bg-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-muted-foreground text-xs">
                    {activity.description}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  {activity.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Card */}
      <Card className="relative overflow-hidden border-blue-200/30 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <div className="absolute right-0 top-0 size-40 bg-blue-300/20 blur-3xl" />
        <CardHeader className="relative">
          <CardTitle className="font-instrument text-2xl font-semibold">
            Your Next Step
          </CardTitle>
          <CardDescription className="mt-1 text-base">
            Keep building momentum
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {completedSubmissions === 0 ? (
                  <>
                    <span className="text-foreground font-medium">
                      Start with Week 1
                    </span>{" "}
                    - Set up your business foundation and digital presence
                  </>
                ) : completedSubmissions < totalAssignments ? (
                  <>
                    <span className="text-foreground font-medium">
                      Continue with Week {completedSubmissions + 1}
                    </span>{" "}
                    - Keep building on your progress
                  </>
                ) : (
                  <>
                    <span className="text-foreground font-medium">
                      Congratulations!
                    </span>{" "}
                    You've completed all assignments. Time to scale your business!
                  </>
                )}
              </p>
            </div>
            <Link href="/dashboard/assignments">
              <Button variant="gradient" className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white">
                <Sparkles className="mr-2 size-4 transition-transform group-hover:rotate-12" />
                {completedSubmissions === 0 ? "Start Building" : "Continue Building"}
                <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto animate-pulse space-y-8 p-6 lg:p-8">
      <div className="h-48 rounded-3xl bg-gray-100" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-32 rounded-2xl bg-gray-100" />
    </div>
  )
}
