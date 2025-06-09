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
  Eye
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
  
  // Current step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Form data state
  const [videoUrl, setVideoUrl] = useState(existingSubmission?.content.videoUrl || "")
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState(existingSubmission?.content.githubUrl || "")
  const [techStack, setTechStack] = useState<string[]>([])
  const [projectDescription, setProjectDescription] = useState("")
  const [reflection, setReflection] = useState(existingSubmission?.content.reflection || "")
  const [supportingFiles, setSupportingFiles] = useState<File[]>([])
  const [existingFiles] = useState(existingSubmission?.content.supportingFiles || [])
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (videoUrl || githubUrl || reflection || techStack.length > 0) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveTimer)
  }, [videoUrl, githubUrl, reflection, techStack])
  
  // Word count for reflection
  useEffect(() => {
    const words = reflection.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [reflection])
  
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
        videoUrl,
        githubUrl,
        techStack,
        projectDescription,
        reflection,
        supportingFiles
      }, true)
      setLastSaved(new Date())
      console.log("[MultiStepSubmissionForm] Auto-save successful")
    } catch (error) {
      console.error("[MultiStepSubmissionForm] Auto-save failed:", error)
    }
  }
  
  const handleTechStackToggle = (tech: string) => {
    setTechStack(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }
  
  const handleFiles = (files: File[]) => {
    // Validate file count
    const totalFiles = supportingFiles.length + files.length
    if (totalFiles > 5) {
      toast.error("Maximum 5 files allowed")
      return
    }
    
    // Validate file sizes and types
    const validFiles = files.filter(file => {
      // Check size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      
      // Check type
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ]
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`)
        return false
      }
      
      return true
    })
    
    setSupportingFiles(prev => [...prev, ...validFiles])
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  
  const removeFile = (index: number) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return assignment.requirements.videoDemo ? !!videoUrl : true
      case 2:
        return assignment.requirements.githubRepo ? !!githubUrl : true
      case 3:
        return assignment.requirements.reflection ? reflection.length >= 100 : true
      case 4:
        return true // Supporting files are optional
      case 5:
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
        videoUrl,
        githubUrl,
        techStack,
        projectDescription,
        reflection,
        supportingFiles
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
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Video Demo</h3>
              <p className="text-muted-foreground">
                Share a video walkthrough of your project
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Upload your demo to YouTube or Loom and paste the link here
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Test Link in New Tab
                  </Button>
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
                <Code2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Project Details</h3>
              <p className="text-muted-foreground">
                Tell us about your implementation
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
                  Link to your project repository
                </p>
              </div>
              
              <div>
                <Label>Tech Stack Used</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select all technologies you used in this project
                </p>
                <div className="flex flex-wrap gap-2">
                  {techStackOptions.map(tech => (
                    <Badge
                      key={tech}
                      variant={techStack.includes(tech) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        techStack.includes(tech) 
                          ? "bg-purple-600 hover:bg-purple-700" 
                          : "hover:bg-purple-50"
                      )}
                      onClick={() => handleTechStackToggle(tech)}
                    >
                      {techStack.includes(tech) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Briefly describe what you built and any special features..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="mt-2"
                  rows={4}
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
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Share your business experience</h3>
              <p className="text-muted-foreground">
                Reflect on your progress, challenges faced, and key insights gained this week.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reflection">
                  Reflection & Key Insights <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Share your thoughts, insights, and challenges..."
                  className="min-h-[200px]"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 100 characters
                </p>
              </div>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Supporting Files</h3>
              <p className="text-muted-foreground">
                Upload any additional documentation (optional)
              </p>
            </div>
            
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-all",
                  isDragging 
                    ? "border-purple-600 bg-purple-50" 
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <Upload className={cn(
                  "w-12 h-12 mx-auto mb-4",
                  isDragging ? "text-purple-600" : "text-gray-400"
                )} />
                <p className="text-sm font-medium mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Support for images, PDFs, and documents • Max 10MB per file
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Select Files
                </Label>
              </div>
              
              {/* Existing files from previous submission */}
              {existingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Previously Uploaded Files</Label>
                  <div className="space-y-2">
                    {existingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Upload className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{file.fileName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.fileUrl, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New files to upload */}
              {supportingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Files to Upload</Label>
                  <div className="space-y-2">
                    {supportingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Upload className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> You can upload design mockups, architecture diagrams, 
                  test results, or any other documentation that showcases your work.
                </p>
              </div>
            </div>
          </div>
        )
        
      case 5:
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
              {/* Video Demo Review */}
              {videoUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Video Demo</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      {videoUrl}
                    </a>
                  </div>
                </div>
              )}
              
              {/* GitHub Repository Review */}
              {githubUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">GitHub Repository</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      {githubUrl}
                    </a>
                  </div>
                </div>
              )}
              
              {/* Tech Stack Review */}
              {techStack.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Tech Stack</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {techStack.map(tech => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Project Description Review */}
              {projectDescription && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Project Description</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{projectDescription}</p>
                  </div>
                </div>
              )}
              
              {/* Reflection Review */}
              {reflection && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Reflection ({wordCount} words)</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reflection}</p>
                  </div>
                </div>
              )}
              
              {/* Files Review */}
              {(supportingFiles.length > 0 || existingFiles.length > 0) && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Supporting Files</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <ul className="space-y-1">
                      {existingFiles.map((file, index) => (
                        <li key={`existing-${index}`} className="text-sm text-gray-600">
                          • {file.fileName} (uploaded)
                        </li>
                      ))}
                      {supportingFiles.map((file, index) => (
                        <li key={`new-${index}`} className="text-sm text-gray-600">
                          • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB) - to be uploaded
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Submission Confirmation */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-purple-900">
                  <strong>Ready to submit?</strong> Once submitted, your assignment will be reviewed by the instructor. 
                  You'll receive AI-powered feedback immediately and instructor feedback within 24-48 hours.
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
          Complete all required steps to submit your assignment
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
              { icon: Video, label: "Video" },
              { icon: Code2, label: "Details" },
              { icon: FileText, label: "Reflection" },
              { icon: Upload, label: "Files" },
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
                    Submit Assignment
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