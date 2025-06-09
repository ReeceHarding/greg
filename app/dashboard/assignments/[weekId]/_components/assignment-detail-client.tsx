"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FirebaseAssignment, FirebaseSubmission } from "@/types/firebase-types"
import { createSubmissionAction, updateSubmissionAction } from "@/actions/db/submissions-actions"
import { uploadFileStorageAction } from "@/actions/storage/storage-actions"
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
  Send
} from "lucide-react"
import { format } from "date-fns"

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
  
  // Form state
  const [videoUrl, setVideoUrl] = useState(existingSubmission?.content.videoUrl || "")
  const [githubUrl, setGithubUrl] = useState(existingSubmission?.content.githubUrl || "")
  const [reflection, setReflection] = useState(existingSubmission?.content.reflection || "")
  const [supportingFiles, setSupportingFiles] = useState<File[]>([])
  
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
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      // Limit to 5 files
      if (fileArray.length > 5) {
        toast.error("Maximum 5 files allowed")
        return
      }
      // Check file sizes (max 10MB each)
      const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        toast.error("Files must be under 10MB each")
        return
      }
      setSupportingFiles(fileArray)
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    
    console.log(`[AssignmentDetailClient] Submitting assignment as ${isDraft ? 'draft' : 'final'}`)
    
    setIsSubmitting(true)
    
    try {
      // Upload supporting files if any
      const uploadedFiles = []
      for (const file of supportingFiles) {
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
      
      // Prepare submission data
      const submissionData = {
        studentId: userId,
        assignmentId: assignment.assignmentId,
        status: (isDraft ? "in_progress" : "submitted") as FirebaseSubmission['status'],
        content: {
          videoUrl: videoUrl || null,
          githubUrl: githubUrl || null,
          reflection: reflection || null,
          supportingFiles: [
            ...(existingSubmission?.content.supportingFiles || []),
            ...uploadedFiles
          ]
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
      
      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
          <CardDescription>
            {existingSubmission ? "Update your submission" : "Complete the requirements and submit your work"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {assignment.requirements.videoDemo && (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video Demo URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Upload your demo to YouTube or Loom and paste the link here
                </p>
              </div>
            )}
            
            {assignment.requirements.githubRepo && (
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub Repository URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Link to your project repository
                </p>
              </div>
            )}
            
            {assignment.requirements.reflection && (
              <div className="space-y-2">
                <Label htmlFor="reflection">Written Reflection</Label>
                <Textarea
                  id="reflection"
                  placeholder="Share your thoughts, learnings, and challenges..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  disabled={isSubmitting}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Reflect on your learning experience and the process
                </p>
              </div>
            )}
            
            {assignment.requirements.supportingDocs && (
              <div className="space-y-2">
                <Label htmlFor="files">Supporting Documents (Optional)</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 files (max 10MB each)
                </p>
                {supportingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {supportingFiles.map((file, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as any, true)}
                disabled={isSubmitting || isPastDue}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Draft"
                )}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isPastDue}
              >
                {isSubmitting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 