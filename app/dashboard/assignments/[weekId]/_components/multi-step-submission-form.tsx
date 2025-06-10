"use client"

import { useState, useEffect } from "react"
import { FirebaseAssignment, FirebaseSubmission } from "@/types/firebase-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  Video, 
  Code2, 
  FileText, 
  Upload, 
  ChevronLeft,
  ChevronRight,
  Check,
  PlayCircle,
  X,
  Loader2,
  Eye,
  Github,
  HelpCircle,
  Lightbulb,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiStepSubmissionFormProps {
  assignment: FirebaseAssignment
  userId: string
  existingSubmission: FirebaseSubmission | null
  onSubmit: (data: any, isDraft: boolean) => Promise<void>
  onPreview?: (data: any) => void
}

// Tech stack options
const techStackOptions = [
  "React", "Next.js", "Vue", "Angular", "Svelte",
  "Node.js", "Python", "Ruby", "PHP", "Java",
  "PostgreSQL", "MySQL", "MongoDB", "Firebase",
  "AWS", "Google Cloud", "Vercel", "Netlify",
  "TypeScript", "JavaScript", "GraphQL", "REST API"
]

// Reflection prompts
const reflectionPrompts = [
  "What was the most challenging part of this assignment?",
  "What new skills or concepts did you learn?",
  "How would you improve your solution if you had more time?",
  "What resources were most helpful in completing this assignment?"
]

export default function MultiStepSubmissionForm({
  assignment,
  userId,
  existingSubmission,
  onSubmit,
  onPreview
}: MultiStepSubmissionFormProps) {
  console.log("[MultiStepSubmissionForm] Rendering multi-step form")
  
  // Current step state - Reduced to 3 steps total
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  
  // Form data state - Simplified
  const [githubUrl, setGithubUrl] = useState(existingSubmission?.content.githubUrl || "")
  const [blockers, setBlockers] = useState("")
  const [insights, setInsights] = useState("")
  const [improvements, setImprovements] = useState("")
  const [videoUrl, setVideoUrl] = useState(existingSubmission?.content.videoUrl || "")
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("")
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (githubUrl || blockers || insights || improvements) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveTimer)
  }, [githubUrl, blockers, insights, improvements])
  
  // Extract video ID and create preview URL
  useEffect(() => {
    if (videoUrl) {
      // YouTube URL patterns
      const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
      if (youtubeMatch) {
        setVideoPreviewUrl(`https://www.youtube.com/embed/${youtubeMatch[1]}`)
        return
      }
      
      // Loom URL pattern
      const loomMatch = videoUrl.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
      if (loomMatch) {
        setVideoPreviewUrl(`https://www.loom.com/embed/${loomMatch[1]}`)
        return
      }
      
      setVideoPreviewUrl("")
    } else {
      setVideoPreviewUrl("")
    }
  }, [videoUrl])
  
  const handleAutoSave = async () => {
    console.log("[MultiStepSubmissionForm] Auto-saving draft")
    try {
      await onSubmit({
        githubUrl,
        reflection: JSON.stringify({
          blockers,
          insights,
          improvements
        }),
        videoUrl
      }, true)
      setLastSaved(new Date())
      console.log("[MultiStepSubmissionForm] Auto-save successful")
    } catch (error) {
      console.error("[MultiStepSubmissionForm] Auto-save failed:", error)
    }
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true // GitHub URL is optional
      case 2:
        // At least one response is required
        return blockers.trim().length > 0 || insights.trim().length > 0 || improvements.trim().length > 0
      case 3:
        return true // Review step - always can proceed
      default:
        return false
    }
  }
  
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const handleSubmit = async (isDraft: boolean) => {
    console.log("[MultiStepSubmissionForm] Submitting form", { isDraft })
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        githubUrl,
        reflection: JSON.stringify({
          blockers,
          insights,
          improvements
        }),
        videoUrl,
        supportingFiles: []
      }, isDraft)
      
      if (!isDraft) {
        toast.success("Assignment submitted successfully!")
      }
    } catch (error) {
      console.error("[MultiStepSubmissionForm] Submission error:", error)
      toast.error("Failed to submit assignment")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Github className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Project Link</h3>
              <p className="text-muted-foreground">
                Share your project repository (optional)
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="githubUrl">GitHub Repository URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Optional: Share your code repository if you built something
                </p>
              </div>
              
              <div className="border-t pt-6">
                <Label htmlFor="videoUrl">Video Demo / Loom (Optional)</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Optional: Share a video walkthrough or explanation
                </p>
              </div>
              
              {videoPreviewUrl && (
                <div className="space-y-2">
                  <Label>Video Preview</Label>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <iframe
                      src={videoPreviewUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Weekly Check-In</h3>
              <p className="text-muted-foreground">
                Help us understand your progress and challenges
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="blockers" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  What are you stuck on this week?
                </Label>
                <Textarea
                  id="blockers"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="Describe any challenges, roadblocks, or areas where you need help..."
                  className="min-h-[120px] mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific so we can help you better
                </p>
              </div>
              
              <div>
                <Label htmlFor="insights" className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  What was your biggest insight from this week?
                </Label>
                <Textarea
                  id="insights"
                  value={insights}
                  onChange={(e) => setInsights(e.target.value)}
                  placeholder="Share your key learnings, aha moments, or breakthroughs..."
                  className="min-h-[120px] mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="improvements" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  How can I make this program better for next week?
                </Label>
                <Textarea
                  id="improvements"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Your feedback helps us improve. What would you like to see changed or added?"
                  className="min-h-[120px] mt-2"
                />
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Review & Submit</h3>
              <p className="text-muted-foreground">
                Review your submission before finalizing
              </p>
            </div>
            
            <div className="space-y-6 bg-gray-50 rounded-lg p-6">
              {/* GitHub Repository Review */}
              {githubUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">GitHub Repository</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      {githubUrl}
                    </a>
                  </div>
                </div>
              )}
              
              {/* Video Demo Review */}
              {videoUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Video Demo</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      {videoUrl}
                    </a>
                  </div>
                </div>
              )}
              
              {/* Check-in Responses */}
              <div className="space-y-4">
                {blockers && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      What you're stuck on
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{blockers}</p>
                    </div>
                  </div>
                )}
                
                {insights && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Your biggest insight
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{insights}</p>
                    </div>
                  </div>
                )}
                
                {improvements && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Your suggestions for improvement
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{improvements}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submission Confirmation */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-purple-900">
                  <strong>Ready to submit?</strong> Your check-in will be reviewed and you'll receive personalized feedback to help you succeed.
                </p>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Submit Assignment</CardTitle>
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <CardDescription>
          Complete your weekly check-in
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {[
              { icon: Github, label: "Links" },
              { icon: MessageSquare, label: "Check-In" },
              { icon: Eye, label: "Review" }
            ].map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center gap-2",
                  index + 1 <= currentStep ? "text-purple-600" : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    index + 1 < currentStep 
                      ? "bg-purple-600 text-white" 
                      : index + 1 === currentStep
                      ? "bg-purple-100 text-purple-600 ring-2 ring-purple-600"
                      : "bg-gray-100"
                  )}
                >
                  {index + 1 < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="min-h-[400px]">
          {renderStep()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>
            
            {currentStep === totalSteps ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !canProceed()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Check-In
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 