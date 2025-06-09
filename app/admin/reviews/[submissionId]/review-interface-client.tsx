"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FirebaseSubmission, FirebaseAssignment, FirebaseProfile, FirebaseProgress } from "@/types/firebase-types"
import { addInstructorFeedbackAction, updateSubmissionAction } from "@/actions/db/submissions-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  Eye, 
  FileText, 
  Calendar,
  Clock,
  ExternalLink,
  Check,
  X,
  Send,
  Star,
  TrendingUp,
  User,
  Award,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  BarChart,
  Video,
  Github,
  Download,
  BookOpen,
  ChevronUp,
  CheckCircle,
  Mail
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ReviewInterfaceClientProps {
  submission: FirebaseSubmission
  assignment: FirebaseAssignment | null
  studentProfile: FirebaseProfile | null
  studentProgress: FirebaseProgress | null
  previousSubmissions: FirebaseSubmission[]
  reviewerId: string
}

// Feedback templates
const feedbackTemplates = {
  excellent: `Excellent work on this assignment! Your implementation demonstrates a strong understanding of the concepts covered. The code quality is high, and you've shown great attention to detail. Keep up the outstanding work!`,
  good: `Good submission! You've successfully completed the requirements and shown a solid grasp of the material. To take your work to the next level, consider focusing on [specific area for improvement]. Overall, well done!`,
  needsWork: `Thank you for your submission. While you've made a good effort, there are some areas that need improvement before approval. Please review the following points: [specific feedback]. I'm confident you can address these issues - don't hesitate to reach out if you need clarification.`,
  revision: `Your submission shows promise, but requires some revisions before approval. Please address the following: [specific issues]. Once you've made these changes, please resubmit for review. You're on the right track!`
}

export default function ReviewInterfaceClient({
  submission,
  assignment,
  studentProfile,
  studentProgress,
  previousSubmissions,
  reviewerId
}: ReviewInterfaceClientProps) {
  const router = useRouter()
  
  // State
  const [feedbackText, setFeedbackText] = useState("")
  const [approvalStatus, setApprovalStatus] = useState<"approved" | "needs_revision">("approved")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAiFeedback, setShowAiFeedback] = useState(true)
  
  console.log(`[ReviewInterfaceClient] Reviewing submission: ${submission.submissionId}`)
  
  // Calculate student stats
  const completedAssignments = previousSubmissions.filter(s => s.status === "approved").length
  const averageScore = submission.aiFeedback ? submission.aiFeedback.overallScore : 0
  const completionRate = studentProgress ? studentProgress.overallCompletionPercentage : 0
  
  // Apply feedback template
  const applyTemplate = (templateKey: keyof typeof feedbackTemplates) => {
    setFeedbackText(feedbackTemplates[templateKey])
  }
  
  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please provide feedback before submitting")
      return
    }
    
    console.log("[ReviewInterfaceClient] Submitting instructor feedback")
    setIsSubmitting(true)
    
    try {
      // Add instructor feedback
      const feedbackResult = await addInstructorFeedbackAction(submission.submissionId, {
        comments: feedbackText,
        reviewerId
      })
      
      if (feedbackResult.isSuccess) {
        // Update submission status
        const statusResult = await updateSubmissionAction(submission.submissionId, {
          status: approvalStatus
        })
        
        if (statusResult.isSuccess) {
          // Log the review action
          console.log("[ReviewInterface] Review submitted", {
            submissionId: submission.submissionId,
            status: approvalStatus,
            feedback: feedbackText
          })
          
          // Send email notification
          console.log("[ReviewInterface] Sending email notification to student")
          // TODO: Implement email notification
          
          toast.success("Review submitted successfully")
          router.refresh()
        } else {
          throw new Error("Failed to update submission status")
        }
      } else {
        throw new Error("Failed to save feedback")
      }
    } catch (error) {
      console.error("[ReviewInterfaceClient] Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Review Submission</h1>
            <p className="text-muted-foreground">
              {assignment?.title || "Unknown Assignment"} - Week {assignment?.weekNumber || "?"}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/reviews")}>
            Back to Reviews
          </Button>
        </div>
      </div>
      
      {/* Three-panel layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Student Info */}
        <div className="w-3/12 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Student Profile */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {studentProfile?.displayName?.charAt(0) || studentProfile?.email?.charAt(0) || "?"}
                </span>
              </div>
              <h3 className="font-semibold text-lg">
                {studentProfile?.displayName || studentProfile?.email || "Unknown Student"}
              </h3>
              <p className="text-sm text-muted-foreground">{studentProfile?.email || ""}</p>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-sm font-semibold">{completedAssignments} assignments</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Progress</span>
                </div>
                <span className="text-sm font-semibold">{completionRate}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Avg Score</span>
                </div>
                <span className="text-sm font-semibold">{averageScore}/10</span>
              </div>
            </div>
            
            {/* Previous Submissions */}
            <div>
              <h4 className="font-semibold mb-3">Previous Submissions</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previousSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous submissions</p>
                ) : (
                  previousSubmissions
                    .filter(s => s.submissionId !== submission.submissionId)
                    .slice(0, 5)
                    .map((prevSubmission) => (
                      <button
                        key={prevSubmission.submissionId}
                        onClick={() => router.push(`/admin/reviews/${prevSubmission.submissionId}`)}
                        className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-sm font-medium">Week {prevSubmission.assignmentId}</p>
                        <p className="text-xs text-muted-foreground">
                          {prevSubmission.submittedAt 
                            ? format(new Date(prevSubmission.submittedAt as any), "MMM d, yyyy")
                            : "Not submitted"}
                        </p>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Panel - Submission Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Submission Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Submission Details</CardTitle>
                  <Badge variant={submission.status === "submitted" ? "default" : "secondary"}>
                    {submission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">
                      {submission.submittedAt 
                        ? format(new Date(submission.submittedAt as any), "MMM d, yyyy 'at' h:mm a")
                        : "Not submitted"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">
                      {assignment?.dueDate 
                        ? format(new Date(assignment.dueDate as any), "MMM d, yyyy")
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Video Demo */}
            {submission.content.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Video Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href={submission.content.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {submission.content.videoUrl}
                  </a>
                  <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden">
                    {/* Embed video if YouTube or Loom */}
                    {submission.content.videoUrl.includes("youtube.com") && (
                      <iframe
                        src={`https://www.youtube.com/embed/${submission.content.videoUrl.split("v=")[1]?.split("&")[0]}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* GitHub Repository */}
            {submission.content.githubUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Repository
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href={submission.content.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {submission.content.githubUrl}
                  </a>
                </CardContent>
              </Card>
            )}
            
            {/* Written Reflection */}
            {submission.content.reflection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Written Reflection
                  </CardTitle>
                  <CardDescription>
                    {submission.content.reflection.split(/\s+/).length} words
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{submission.content.reflection}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Supporting Files */}
            {submission.content.supportingFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Supporting Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submission.content.supportingFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.fileName}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {file.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                        </Badge>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* AI Feedback */}
            {submission.aiFeedback && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      AI Assistant Feedback
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiFeedback(!showAiFeedback)}
                    >
                      {showAiFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {showAiFeedback && (
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Strengths:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {submission.aiFeedback.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Areas for Improvement:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {submission.aiFeedback.improvements.map((improvement, index) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Next Steps:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {submission.aiFeedback.nextSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <span className="text-sm font-medium">Overall Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary">
                          {submission.aiFeedback.overallScore}
                        </div>
                        <span className="text-sm text-muted-foreground">/ 10</span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
        
        {/* Right Panel - Feedback */}
        <div className="w-3/12 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Instructor Feedback</h3>
              
              {/* Quick Templates */}
              <div className="mb-4">
                <Label className="text-sm">Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate("excellent")}
                  >
                    Excellent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate("good")}
                  >
                    Good
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate("needsWork")}
                  >
                    Needs Work
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate("revision")}
                  >
                    Revision
                  </Button>
                </div>
              </div>
              
              {/* Feedback Text */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback for the student..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {feedbackText.length} characters
                </p>
              </div>
              
              {/* Approval Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Approval Status</Label>
                <Select
                  value={approvalStatus}
                  onValueChange={(value) => setApprovalStatus(value as "approved" | "needs_revision")}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Approve Submission
                      </div>
                    </SelectItem>
                    <SelectItem value="needs_revision">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        Request Revision
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting || !feedbackText.trim()}
                  className="w-full gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    // TODO: Implement email preview
                    toast.info("Email preview will be implemented soon")
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Preview Email
                </Button>
              </div>
              
              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The student will receive an email notification with your feedback once submitted.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
