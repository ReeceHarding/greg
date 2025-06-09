"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Zap, TrendingUp, CheckCircle, Target } from "lucide-react"
import { getStudentProgressAction, generateProgressAnalysisAction } from "@/actions/db/progress-actions"
import { FirebaseProgress, SerializedFirebaseAssignment } from "@/types/firebase-types"
import { toast } from "@/hooks/use-toast"

interface ProgressClientProps {
  userId: string
  assignments: SerializedFirebaseAssignment[]
  totalVideos: number
}

export default function ProgressClient({ userId, assignments, totalVideos }: ProgressClientProps) {
  const [progress, setProgress] = useState<FirebaseProgress | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)

  // Load progress on mount
  useEffect(() => {
    loadProgress()
  }, [userId])

  const loadProgress = async () => {
    console.log("[ProgressClient] Loading progress for user:", userId)
    setIsLoadingProgress(true)
    
    try {
      const result = await getStudentProgressAction(userId)
      if (result.isSuccess && result.data) {
        setProgress(result.data)
        
        // Check if we have a recent analysis
        const recentReport = result.data.weeklyReports.find(report => {
          const reportDate = new Date(report.generatedAt as any)
          const hoursSince = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60)
          return hoursSince < 24
        })
        
        if (recentReport) {
          setAiAnalysis(recentReport.report)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load progress",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[ProgressClient] Error loading progress:", error)
      toast({
        title: "Error",
        description: "Failed to load progress",
        variant: "destructive"
      })
    } finally {
      setIsLoadingProgress(false)
    }
  }

  const generateAnalysis = async () => {
    console.log("[ProgressClient] Generating AI analysis")
    setIsGeneratingAnalysis(true)
    
    try {
      const result = await generateProgressAnalysisAction(userId)
      if (result.isSuccess && result.data) {
        setAiAnalysis(result.data)
        toast({
          title: "Success",
          description: "AI analysis generated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate analysis",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[ProgressClient] Error generating analysis:", error)
      toast({
        title: "Error",
        description: "Failed to generate analysis",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAnalysis(false)
    }
  }

  if (isLoadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No progress data found</p>
      </div>
    )
  }

  // Calculate current streak
  const calculateStreak = () => {
    // This is a simplified version - you might want to track daily activity
    const lastActive = progress.forumStats.lastActiveAt
    if (!lastActive) return 0
    
    const daysSinceActive = Math.floor((Date.now() - new Date(lastActive as any).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceActive <= 1 ? 7 : 0 // Mock streak for demo
  }

  const streak = calculateStreak()

  return (
    <div className="space-y-12">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Overall Progress */}
        <Card className="bg-white/80 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-5xl font-bold text-primary mb-2">
                {progress.overallCompletionPercentage}%
              </div>
              <p className="text-sm text-muted-foreground">Course completion</p>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000" 
                style={{ width: `${progress.overallCompletionPercentage}%` }} 
              />
            </div>
            <p className="mt-4 text-sm text-primary font-medium">
              {progress.overallCompletionPercentage < 25 ? "Great start! Keep going 💪" :
               progress.overallCompletionPercentage < 50 ? "Making excellent progress! 🚀" :
               progress.overallCompletionPercentage < 75 ? "You're crushing it! 🎯" :
               "Almost there! Final stretch! 🏁"}
            </p>
          </CardContent>
        </Card>

        {/* Current Week */}
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 hover:scale-[1.02] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Current Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-5xl font-bold text-accent mb-2">
                Week {progress.currentWeek}
              </div>
              <p className="text-sm text-muted-foreground">of 8 weeks</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
                <div
                  key={week}
                  className={`flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                    week <= progress.currentWeek
                      ? "bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {week <= progress.currentWeek ? "✓" : week}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-accent font-medium">
              {progress.currentWeek < 3 ? "Building momentum! 🌱" :
               progress.currentWeek < 5 ? "Halfway there! 🎯" :
               progress.currentWeek < 7 ? "In the home stretch! 🏃" :
               "Final week! You got this! 🎉"}
            </p>
          </CardContent>
        </Card>

        {/* Check-ins Status */}
        <Card className="bg-white/80 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-5xl font-bold mb-2">
                {progress.assignmentsCompleted.length}/{assignments.length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-xl">
                <span className="text-sm font-medium">Submitted</span>
                <span className="text-sm font-bold text-accent">
                  {progress.assignmentsCompleted.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                <span className="text-sm font-medium">Videos Watched</span>
                <span className="text-sm font-bold text-primary">
                  {progress.videosWatched.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm font-medium">Forum Posts</span>
                <span className="text-sm font-bold">
                  {progress.forumStats.postsCreated}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </span>
                AI-Powered Insights
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Personalized feedback and recommendations based on your progress
              </p>
            </div>
            <Button
              onClick={generateAnalysis}
              disabled={isGeneratingAnalysis}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-primary shadow-[0_4px_20px_rgba(59,130,246,0.2)]"
            >
              {isGeneratingAnalysis ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Refresh Insights"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiAnalysis ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Your Strengths
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click "Refresh Insights" to get AI-powered analysis of your strengths based on your progress and engagement.
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Growth Opportunities
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our AI will identify areas where you can improve and provide actionable steps to accelerate your entrepreneurship journey.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress Timeline */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Your Entrepreneurship Journey</CardTitle>
          <CardDescription>
            Track your progress through the 8-week program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {assignments.map((assignment, index) => {
              const isCompleted = progress.assignmentsCompleted.includes(assignment.assignmentId)
              const isCurrent = assignment.weekNumber === progress.currentWeek
              const isUpcoming = assignment.weekNumber > progress.currentWeek
              
              return (
                <div key={assignment.assignmentId} className="relative">
                  {/* Connection Line */}
                  {index < assignments.length - 1 && (
                    <div className={`absolute left-7 top-20 w-0.5 h-24 ${
                      isCompleted ? "bg-accent" : "bg-border"
                    }`} />
                  )}
                  
                  {/* Timeline Item */}
                  <div className="flex gap-6 items-start p-6 rounded-2xl hover:bg-muted/30 transition-all duration-200">
                    {/* Status Indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                        isCompleted
                          ? "bg-accent text-accent-foreground"
                          : isCurrent
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : isUpcoming
                          ? "bg-white border-2 border-primary text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : isCurrent ? (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        ) : (
                          assignment.weekNumber
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold mb-1">Week {assignment.weekNumber}</h4>
                          <p className="text-lg font-medium text-primary">{assignment.title}</p>
                        </div>
                        <span className={`text-sm font-medium ${
                          isCompleted ? "text-accent" :
                          isCurrent ? "text-primary" :
                          "text-muted-foreground"
                        }`}>
                          {isCompleted ? "Completed" :
                           isCurrent ? "In Progress" :
                           "Upcoming"}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        {assignment.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Section */}
      <div className="text-center p-10 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl">
        <h3 className="text-2xl font-bold mb-4">
          {progress.overallCompletionPercentage < 25 ? "You're just getting started! 🌟" :
           progress.overallCompletionPercentage < 50 ? "You're doing amazing! 🎉" :
           progress.overallCompletionPercentage < 75 ? "You're on fire! 🔥" :
           "You're almost there! 🏆"}
        </h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          You've completed {progress.overallCompletionPercentage}% of the program. 
          Keep up this momentum and you'll be launching your AI business in no time!
        </p>
        <Button 
          className="mt-6 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-full font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => window.location.href = `/dashboard/assignments/${progress.currentWeek}`}
        >
          Continue to Week {progress.currentWeek} Check-in
        </Button>
      </div>
    </div>
  )
} 