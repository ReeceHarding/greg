/*
<ai_context>
This server page displays the main dashboard with user stats and quick actions.
It uses Firebase Auth and Firestore to get user data.
</ai_context>
*/

"use server"

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
import { redirect } from "next/navigation"
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
import { Suspense } from "react"
import FirestoreSetupNotice from "@/components/utilities/firestore-setup-notice"

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

    // Create profile with available data
    // Note: DecodedIdToken from session might have limited data
    const role = authResult.role || "student"
    const email = user?.email || ""
    const displayName = email.split("@")[0] || "User"

    profileResult = await createProfileAction({
      userId: userId,
      email: email,
      displayName: displayName,
      photoURL: "",
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

  const stats = [
    {
      title: "Monthly Revenue",
      value: "$48,291",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      description: "from last month",
      trend: [20, 25, 22, 28, 32, 35, 48]
    },
    {
      title: "Active Users",
      value: "2,345",
      change: "+5.4%",
      changeType: "positive",
      icon: Users,
      description: "from last month",
      trend: [100, 120, 115, 130, 125, 140, 155]
    },
    {
      title: "Conversion Rate",
      value: "3.45%",
      change: "-2.1%",
      changeType: "negative",
      icon: TrendingUp,
      description: "from last month",
      trend: [3.8, 3.9, 3.7, 3.6, 3.5, 3.4, 3.45]
    },
    {
      title: "Total Sales",
      value: "892",
      change: "+18.2%",
      changeType: "positive",
      icon: ShoppingCart,
      description: "from last month",
      trend: [650, 680, 700, 750, 780, 820, 892]
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

  const recentActivities = [
    {
      title: "New Project Started",
      description: "You've started a new project",
      time: "10:00 AM"
    },
    {
      title: "Payment Received",
      description: "You've received a payment",
      time: "11:00 AM"
    },
    {
      title: "New Message",
      description: "You've received a new message",
      time: "12:00 PM"
    }
  ]

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Welcome Section - Modern and sleek */}
      <Card className="relative overflow-hidden rounded-2xl border-0 bg-white p-8 shadow-sm">
        <div className="relative">
          <h1 className="mb-2 text-3xl font-semibold text-gray-900">
            Welcome back, {profile?.displayName || "User"}!
          </h1>
          <p className="mb-6 text-gray-600">
            Your dashboard is ready with all the tools you need.
          </p>
          <Button
            size="default"
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Get Started
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </Card>

      {/* Stats Grid - Following the metric card pattern from the guide */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="group relative rounded-2xl border border-purple-100/20 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-purple-300/40 hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </h3>
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 shadow-lg shadow-purple-500/20">
                <stat.icon className="size-5 text-white" />
              </div>
            </div>

            <div className="mb-3">
              <span className="font-instrument bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
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
                  className="flex-1 rounded-t bg-purple-200/50"
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

      {/* Membership Status - Enhanced design */}
      <Card className="relative overflow-hidden border-purple-200/30 bg-gradient-to-r from-purple-50 to-purple-100/50">
        <div className="absolute right-0 top-0 size-40 bg-purple-300/20 blur-3xl" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-instrument text-2xl font-semibold">
                Membership Status
              </CardTitle>
              <CardDescription className="mt-1 text-base">
                Your current plan and benefits
              </CardDescription>
            </div>
            <Badge
              variant={profile?.membership === "pro" ? "gradient" : "secondary"}
              size="lg"
              className="font-semibold uppercase"
            >
              {profile?.membership || "free"} plan
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {profile?.membership === "pro" ? (
                  <>
                    <span className="text-foreground font-medium">
                      Unlimited access
                    </span>{" "}
                    to all premium features and priority support
                  </>
                ) : (
                  <>
                    Upgrade to{" "}
                    <span className="font-medium text-purple-600">Pro</span> to
                    unlock advanced features and priority support
                  </>
                )}
              </p>
              {profile?.membership === "pro" && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-purple-600">
                    <div className="size-2 animate-pulse rounded-full bg-purple-600" />
                    <span>Active</span>
                  </div>
                  <span className="text-muted-foreground">
                    Next billing: January 15, 2024
                  </span>
                </div>
              )}
            </div>
            {profile?.membership !== "pro" && (
              <Link href="/pricing">
                <Button variant="gradient" className="group">
                  <Sparkles className="mr-2 size-4 transition-transform group-hover:rotate-12" />
                  Upgrade to Pro
                  <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Enhanced with better visual hierarchy */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-instrument text-2xl font-semibold">
              Quick Actions
            </h2>
            <p className="text-muted-foreground mt-1">
              Common tasks and settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={action.title} href={action.href}>
              <Card className="group h-full cursor-pointer border-purple-100/20 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-purple-300/40 hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)]">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gray-50 transition-colors group-hover:bg-gray-100">
                      <action.icon className="size-6 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold transition-colors group-hover:text-purple-600">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        {action.description}
                      </CardDescription>
                      <div className="pt-2">
                        <span className="inline-flex items-center text-sm font-medium text-purple-600 transition-all group-hover:gap-2">
                          {action.actionText}
                          <ArrowUpRight className="ml-1 size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Project Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">
                Total Projects
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-instrument text-3xl font-bold text-purple-600">
                  12
                </span>
                <span className="text-sm font-medium text-green-600">
                  +2.5%
                </span>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-purple-600 bg-white shadow-sm">
              <FolderOpen className="size-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="relative overflow-hidden border-gray-200 bg-white">
          <div className="absolute right-0 top-0 size-40 bg-purple-50/30 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold text-black">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5">
                  <div className="size-2 animate-pulse rounded-full bg-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 font-medium text-black">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full">
              View all activity
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
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
