"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  User,
  Flame,
  Star,
  CheckCircle2,
  Zap,
  Target,
  Users,
  Calendar,
  Clock,
  ChevronUp,
  ChevronDown,
  Crown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardData {
  studentId: string
  displayName: string
  photoURL: string | null
  email: string
  totalPoints: number
  currentStreak: number
  assignmentsCompleted: number
  badges: string[]
  lastActiveAt: string | null
}

interface LeaderboardClientProps {
  leaderboardData: LeaderboardData[]
  currentUserId: string
}

// Badge definitions
const badgeDefinitions = {
  fast_starter: {
    name: "Fast Starter",
    description: "Complete Week 1 in your first week",
    icon: Zap,
    color: "text-yellow-600 bg-yellow-100"
  },
  consistent_contributor: {
    name: "Consistent Contributor",
    description: "Submit assignments for 4 weeks in a row",
    icon: Calendar,
    color: "text-blue-600 bg-blue-100"
  },
  helping_hand: {
    name: "Helping Hand",
    description: "Help 5 students in the forum",
    icon: Users,
    color: "text-green-600 bg-green-100"
  },
  perfect_week: {
    name: "Perfect Week",
    description: "Complete all activities in a single week",
    icon: Star,
    color: "text-purple-600 bg-purple-100"
  },
  ai_explorer: {
    name: "AI Explorer",
    description: "Watch 10+ AI-related videos",
    icon: Target,
    color: "text-pink-600 bg-pink-100"
  },
  early_bird: {
    name: "Early Bird",
    description: "Submit 3 assignments before the due date",
    icon: Clock,
    color: "text-orange-600 bg-orange-100"
  }
}

// Points breakdown
const pointsBreakdown = {
  assignment_completion: {
    label: "Assignment Completion",
    points: 100,
    description: "Complete and submit an assignment"
  },
  on_time_submission: {
    label: "On-Time Submission",
    points: 20,
    description: "Submit before the deadline"
  },
  forum_post: {
    label: "Forum Participation",
    points: 5,
    description: "Create a helpful forum post"
  },
  perfect_week: {
    label: "Perfect Week Bonus",
    points: 50,
    description: "Complete all weekly requirements"
  },
  streak_bonus: {
    label: "Streak Bonus",
    points: 10,
    description: "Per day of continuous activity"
  }
}

export default function LeaderboardClient({ leaderboardData, currentUserId }: LeaderboardClientProps) {
  console.log("[LeaderboardClient] Rendering with", leaderboardData.length, "students")
  
  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  
  // Calculate current user's rank and stats
  const currentUserData = useMemo(() => {
    const userIndex = leaderboardData.findIndex(student => student.studentId === currentUserId)
    if (userIndex === -1) return null
    
    return {
      rank: userIndex + 1,
      data: leaderboardData[userIndex],
      percentile: Math.round(((leaderboardData.length - userIndex - 1) / leaderboardData.length) * 100)
    }
  }, [leaderboardData, currentUserId])
  
  // Get top 10 students for display
  const top10Students = leaderboardData.slice(0, 10)
  
  // Mock rank changes (in real app, compare with previous week)
  const getRankChange = (studentId: string) => {
    const random = Math.random()
    if (random > 0.7) return { direction: "up", value: Math.floor(Math.random() * 3) + 1 }
    if (random < 0.3) return { direction: "down", value: Math.floor(Math.random() * 3) + 1 }
    return { direction: "same", value: 0 }
  }
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>
  }
  
  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300"
    if (rank === 2) return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300"
    if (rank === 3) return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300"
    return ""
  }
  
  return (
    <div className="space-y-6">
      {/* Current User Stats */}
      {currentUserData && (
        <Card className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-purple-100 text-sm mb-1">Current Rank</p>
                <p className="text-4xl font-bold">#{currentUserData.rank}</p>
                <p className="text-purple-100 text-sm mt-1">of {leaderboardData.length} students</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Points</p>
                <p className="text-4xl font-bold">{currentUserData.data.totalPoints}</p>
                <p className="text-purple-100 text-sm mt-1">Top {currentUserData.percentile}%</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm mb-1">Current Streak</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-8 h-8 text-orange-300" />
                  <p className="text-4xl font-bold">{currentUserData.data.currentStreak}</p>
                  <span className="text-purple-100 text-sm">days</span>
                </div>
              </div>
              <div>
                <p className="text-purple-100 text-sm mb-1">Badges Earned</p>
                <p className="text-4xl font-bold">{currentUserData.data.badges.length}</p>
                <p className="text-purple-100 text-sm mt-1">of {Object.keys(badgeDefinitions).length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Students</CardTitle>
                  <CardDescription>Leading the pack this week</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  Week 8
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {top10Students.map((student, index) => {
                  const rank = index + 1
                  const rankChange = getRankChange(student.studentId)
                  const isCurrentUser = student.studentId === currentUserId
                  
                  return (
                    <div
                      key={student.studentId}
                      className={cn(
                        "p-4 transition-all duration-200 hover:bg-muted/50",
                        getRankStyle(rank),
                        isCurrentUser && "ring-2 ring-purple-500 ring-offset-2"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex items-center gap-2 w-16">
                          {getRankIcon(rank)}
                          {rankChange.direction === "up" && (
                            <div className="flex items-center text-green-600 text-xs">
                              <ChevronUp className="w-3 h-3" />
                              {rankChange.value}
                            </div>
                          )}
                          {rankChange.direction === "down" && (
                            <div className="flex items-center text-red-600 text-xs">
                              <ChevronDown className="w-3 h-3" />
                              {rankChange.value}
                            </div>
                          )}
                          {rankChange.direction === "same" && (
                            <Minus className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {student.displayName}
                              {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.assignmentsCompleted} assignments completed
                            </p>
                          </div>
                        </div>
                        
                        {/* Points & Streak */}
                        <div className="text-right">
                          <p className="font-bold text-lg">{student.totalPoints} pts</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>{student.currentStreak} day streak</span>
                          </div>
                        </div>
                        
                        {/* Action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student.studentId)
                            toast.info(`Viewing ${student.displayName}'s profile`)
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Show More */}
              {leaderboardData.length > 10 && (
                <div className="p-4 text-center border-t">
                  <Button variant="outline" size="sm">
                    Show All {leaderboardData.length} Students
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Points Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                How to Earn Points
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPointsBreakdown(!showPointsBreakdown)}
                >
                  {showPointsBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {showPointsBreakdown && (
              <CardContent className="space-y-3">
                {Object.entries(pointsBreakdown).map(([key, info]) => (
                  <div key={key} className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{info.label}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      +{info.points}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
          
          {/* Achievement Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Achievement Badges</CardTitle>
              <CardDescription>Unlock badges by completing challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(badgeDefinitions).map(([key, badge]) => {
                  const isUnlocked = currentUserData?.data.badges.includes(key) || false
                  const Icon = badge.icon
                  
                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative p-3 rounded-lg text-center transition-all duration-200",
                        isUnlocked 
                          ? `${badge.color} cursor-pointer hover:scale-105` 
                          : "bg-gray-100 text-gray-400 opacity-50"
                      )}
                      title={badge.description}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs font-medium line-clamp-1">{badge.name}</p>
                      {isUnlocked && (
                        <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-green-600 bg-white rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center">
                <Progress 
                  value={(currentUserData?.data.badges.length || 0) / Object.keys(badgeDefinitions).length * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {currentUserData?.data.badges.length || 0} of {Object.keys(badgeDefinitions).length} badges unlocked
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Motivational Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-purple-700" />
                </div>
                <h3 className="font-semibold text-purple-900">Keep Climbing!</h3>
                <p className="text-sm text-purple-700">
                  You're {currentUserData ? `${10 - currentUserData.rank}` : "a few"} spots away from the top 10. 
                  Complete this week's assignment to earn 100 points!
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = "/dashboard/assignments"}
                >
                  View Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 