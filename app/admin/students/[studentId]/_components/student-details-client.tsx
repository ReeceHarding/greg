"use client"

import { ArrowLeft, Mail, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FirebaseProfile, FirebaseProgress, FirebaseSubmission } from "@/types/firebase-types"

interface StudentDetailsClientProps {
  profile: FirebaseProfile
  progress: FirebaseProgress | null
  submissions: FirebaseSubmission[]
}

export default function StudentDetailsClient({ 
  profile, 
  progress, 
  submissions 
}: StudentDetailsClientProps) {
  const completionRate = progress?.overallCompletionPercentage || 0
  const currentWeek = progress?.currentWeek || 1
  const totalPoints = progress?.totalPoints || 0
  
  // Group submissions by status
  const pendingSubmissions = submissions.filter(s => s.status === "submitted" && !s.instructorFeedback)
  const approvedSubmissions = submissions.filter(s => s.status === "approved")
  const needsRevisionSubmissions = submissions.filter(s => s.status === "needs_revision")

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/students" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.photoURL} alt={profile.displayName} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {(profile.displayName || profile.email || 'S').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{profile.displayName || profile.email}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeek} of 8</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">{approvedSubmissions.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">{pendingSubmissions.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">{needsRevisionSubmissions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions History */}
      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
          <CardDescription>
            All assignments submitted by this student
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No submissions yet
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">Week {submission.assignmentId.replace('week-', '')}</h4>
                    <p className="text-sm text-muted-foreground">
                      Submitted {submission.submittedAt 
                        ? new Date(submission.submittedAt instanceof Date 
                          ? submission.submittedAt 
                          : submission.submittedAt.seconds * 1000
                        ).toLocaleDateString() 
                        : 'Unknown date'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      submission.status === "approved" ? "default" :
                      submission.status === "needs_revision" ? "destructive" :
                      "secondary"
                    }>
                      {submission.status === "approved" ? "Approved" :
                       submission.status === "needs_revision" ? "Needs Revision" :
                       "Pending Review"}
                    </Badge>
                    
                    <Link 
                      href={`/admin/reviews/${submission.submissionId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Details */}
      {progress && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Progress Details</CardTitle>
            <CardDescription>
              Detailed progress information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Videos Watched</h4>
                <p className="text-2xl font-bold">{progress.videosWatched?.length || 0}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Forum Activity</h4>
                <div className="space-y-1 text-sm">
                  <p>Posts: {progress.forumStats?.postsCreated || 0}</p>
                  <p>Replies: {progress.forumStats?.repliesCreated || 0}</p>
                  <p>Upvotes: {progress.forumStats?.upvotesReceived || 0}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Current Streak</h4>
                <p className="text-2xl font-bold">{progress.currentStreak || 0} days</p>
              </div>
            </div>
            
            {progress.badges && progress.badges.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Badges Earned</h4>
                <div className="flex flex-wrap gap-2">
                  {progress.badges.map((badge, index) => (
                    <Badge key={index} variant="secondary">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
} 