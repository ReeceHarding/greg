"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FirebaseAssignment, FirebaseSubmission } from "@/types/firebase-types"
import { createSubmissionAction, updateSubmissionAction } from "@/actions/db/submissions-actions"
import { uploadFileStorageAction } from "@/actions/storage/storage-actions"
import { generateAIFeedbackAction } from "@/actions/ai/feedback-actions"
import { Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  Calendar, 
  CheckCircle2, 
  Upload, 
  Video, 
  Github, 
  FileText, 
  AlertCircle,
  Clock,
  Send,
  Eye,
  X
} from "lucide-react"
import { format } from "date-fns"
import MultiStepSubmissionForm from "./multi-step-submission-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AssignmentDetailClientProps {
  assignment: FirebaseAssignment
  userId: string
  existingSubmission: FirebaseSubmission | null
}

export default function AssignmentDetailClient({ 
  assignment, 
  userId, 
  existingSubmission 
}: AssignmentDetailClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showMultiStepForm, setShowMultiStepForm] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  
  console.log(`[AssignmentDetailClient] Rendering assignment: ${assignment.title}`)
  
  // Check if assignment is past due
  const dueDate = assignment.dueDate ? 
    (assignment.dueDate as any).toDate?.() || new Date(assignment.dueDate as any) : 
    new Date()
  const isPastDue = new Date() > dueDate
  
  // Get status badge color
  const getStatusBadge = () => {
    if (!existingSubmission) {
      return <Badge variant="secondary">Not Started</Badge>
    }
    
    switch (existingSubmission.status) {
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "submitted":
        return <Badge variant="default">Submitted</Badge>
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "needs_revision":
        return <Badge variant="destructive">Needs Revision</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }
  
  // Handle form submission from multi-step form
  const handleSubmit = async (data: any, isDraft: boolean = false) => {
    console.log(`[AssignmentDetailClient] Submitting assignment as ${isDraft ? 'draft' : 'final'}`)
    
    setIsSubmitting(true)
    
    try {
      // Upload supporting files if any
      const uploadedFiles = []
      for (const file of data.supportingFiles || []) {
        console.log(`[AssignmentDetailClient] Uploading file: ${file.name}`)
        
        const buffer = await file.arrayBuffer()
        const uploadResult = await uploadFileStorageAction(
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
          `submissions/${userId}/${assignment.assignmentId}/${file.name}`,
          Buffer.from(buffer),
          file.type
        )
        
        if (uploadResult.isSuccess && uploadResult.data) {
          uploadedFiles.push({
            fileName: file.name,
            fileUrl: uploadResult.data.url,
            fileType: file.type,
            uploadedAt: Timestamp.fromDate(new Date()) as any
          })
        } else {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      
      // Prepare submission data with tech stack and project description
      const submissionData = {
        studentId: userId,
        assignmentId: assignment.assignmentId,
        status: (isDraft ? "in_progress" : "submitted") as FirebaseSubmission['status'],
        content: {
          videoUrl: data.videoUrl || null,
          githubUrl: data.githubUrl || null,
          reflection: data.reflection || null,
          supportingFiles: [
            ...(existingSubmission?.content.supportingFiles || []),
            ...uploadedFiles
          ],
          // Store additional data in reflection for now (will expand schema later)
          techStack: data.techStack || [],
          projectDescription: data.projectDescription || ""
        }
      }
      
      // Create or update submission
      let result
      if (existingSubmission) {
        console.log(`[AssignmentDetailClient] Updating existing submission: ${existingSubmission.submissionId}`)
        result = await updateSubmissionAction(
          existingSubmission.submissionId,
          submissionData
        )
      } else {
        console.log("[AssignmentDetailClient] Creating new submission")
        result = await createSubmissionAction(submissionData)
      }
      
      if (result.isSuccess) {
        toast.success(isDraft ? "Draft saved successfully" : "Assignment submitted successfully")
        
        // Generate AI feedback if submitted (not draft)
        if (!isDraft && result.data) {
          console.log("[AssignmentDetailClient] Triggering AI feedback generation")
          toast.info("Generating AI feedback...")
          
          const feedbackResult = await generateAIFeedbackAction(result.data.submissionId)
          if (feedbackResult.isSuccess) {
            toast.success("AI feedback generated! Check the feedback section above.")
          } else {
            console.error("[AssignmentDetailClient] Failed to generate AI feedback:", feedbackResult.message)
          }
        }
        
        setShowMultiStepForm(false)
        router.refresh()
      } else {
        throw new Error(result.message)
      }
      
    } catch (error) {
      console.error("[AssignmentDetailClient] Error submitting:", error)
      toast.error("Failed to submit assignment")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle preview modal
  const handlePreviewSubmission = () => {
    if (!formData) return
    setShowPreviewModal(true)
  }
  
  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription>Week {assignment.weekNumber} - {assignment.theme}</CardDescription>
            </div>
            <div className="text-right space-y-2">
              {getStatusBadge()}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due {format(dueDate, "MMM d, yyyy")}
              </div>
              {isPastDue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Past Due
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{assignment.description}</p>
          </div>
          
          {/* Requirements */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">Requirements:</h3>
            <div className="space-y-2">
              {assignment.requirements.videoDemo && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Video demo (YouTube or Loom)</span>
                </div>
              )}
              {assignment.requirements.githubRepo && (
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">GitHub repository link</span>
                </div>
              )}
              {assignment.requirements.reflection && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Written reflection</span>
                </div>
              )}
              {assignment.requirements.supportingDocs && (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Supporting documents (optional)</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Feedback Section (if exists) */}
      {existingSubmission && (existingSubmission.aiFeedback || existingSubmission.instructorFeedback) && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingSubmission.aiFeedback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">AI Assistant Feedback:</p>
                    <div className="space-y-1">
                      <p><strong>Strengths:</strong> {existingSubmission.aiFeedback.strengths.join(", ")}</p>
                      <p><strong>Areas for improvement:</strong> {existingSubmission.aiFeedback.improvements.join(", ")}</p>
                      <p><strong>Next steps:</strong> {existingSubmission.aiFeedback.nextSteps.join(", ")}</p>
                      <p><strong>Score:</strong> {existingSubmission.aiFeedback.overallScore}/10</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {existingSubmission.instructorFeedback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Instructor Feedback:</p>
                    <p>{existingSubmission.instructorFeedback.comments}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Submission Form Button */}
      {!showMultiStepForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>
              {existingSubmission ? "Update your submission" : "Complete the requirements and submit your work"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Ready to submit?</h3>
                <p className="text-muted-foreground">
                  Use our guided submission process to ensure you include everything needed for a successful assignment.
                </p>
                <Button
                  onClick={() => setShowMultiStepForm(true)}
                  disabled={isPastDue}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  {existingSubmission ? "Update Submission" : "Start Submission"}
                </Button>
                {isPastDue && (
                  <p className="text-sm text-destructive">
                    This assignment is past due and can no longer be submitted.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Multi-Step Submission Form */}
      {showMultiStepForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-0 top-0 z-50 h-full overflow-y-auto">
            <div className="min-h-full p-4 flex items-start justify-center">
              <div className="w-full max-w-5xl my-8">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Assignment Submission</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMultiStepForm(false)}
                    className="rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <MultiStepSubmissionForm
                  assignment={assignment}
                  userId={userId}
                  existingSubmission={existingSubmission}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Submission Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Preview</DialogTitle>
            <DialogDescription>
              Review your submission before finalizing
            </DialogDescription>
          </DialogHeader>
          
          {formData && (
            <div className="space-y-6 mt-4">
              {formData.videoUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Video Demo</h4>
                  <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {formData.videoUrl}
                  </a>
                </div>
              )}
              
              {formData.githubUrl && (
                <div>
                  <h4 className="font-semibold mb-2">GitHub Repository</h4>
                  <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {formData.githubUrl}
                  </a>
                </div>
              )}
              
              {formData.techStack && formData.techStack.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.techStack.map((tech: string) => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.projectDescription && (
                <div>
                  <h4 className="font-semibold mb-2">Project Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{formData.projectDescription}</p>
                </div>
              )}
              
              {formData.reflection && (
                <div>
                  <h4 className="font-semibold mb-2">Reflection</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{formData.reflection}</p>
                </div>
              )}
              
              {formData.supportingFiles && formData.supportingFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Supporting Files</h4>
                  <ul className="space-y-1">
                    {formData.supportingFiles.map((file: File, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Back to Edit
                </Button>
                <Button
                  onClick={() => {
                    handleSubmit(formData, false)
                    setShowPreviewModal(false)
                  }}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  Submit Assignment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 