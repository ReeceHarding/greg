"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ExternalLink } from "lucide-react"
import { updateUserOnboardingAction } from "@/actions/db/users-actions"
import { toast } from "sonner"

interface OnboardingModalProps {
  userId: string
  onboardingStatus: {
    cursorInstalled: boolean
    n8nAccountCreated: boolean
    domainConfigured: boolean
    hostingSetup: boolean
    completedAt: any
  }
}

const onboardingSteps = [
  {
    id: "cursorInstalled",
    title: "Install Cursor AI Editor",
    description: "Download and install Cursor, the AI-powered code editor we'll use throughout the program.",
    link: "https://cursor.sh",
    linkText: "Download Cursor"
  },
  {
    id: "n8nAccountCreated",
    title: "Create n8n Account",
    description: "Sign up for n8n to build powerful automation workflows for your AI business.",
    link: "https://n8n.io",
    linkText: "Sign up for n8n"
  },
  {
    id: "domainConfigured",
    title: "Configure Your Domain",
    description: "Set up your business domain to establish your online presence.",
    link: "https://namecheap.com",
    linkText: "Get a Domain"
  },
  {
    id: "hostingSetup",
    title: "Set Up Hosting",
    description: "Deploy your website with Vercel for fast, reliable hosting.",
    link: "https://vercel.com",
    linkText: "Sign up for Vercel"
  }
]

export default function OnboardingModal({ userId, onboardingStatus }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(onboardingStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Check if onboarding is needed
  useEffect(() => {
    if (!currentStatus.completedAt) {
      console.log("[OnboardingModal] Onboarding not completed, showing modal")
      setIsOpen(true)
    }
  }, [currentStatus.completedAt])
  
  // Calculate progress
  const completedSteps = Object.entries(currentStatus)
    .filter(([key, value]) => key !== "completedAt" && value === true)
    .length
  const progress = (completedSteps / onboardingSteps.length) * 100
  
  // Handle step completion
  const handleStepComplete = async (stepId: string) => {
    console.log(`[OnboardingModal] Marking step as complete: ${stepId}`)
    setIsUpdating(true)
    
    try {
      const updatedStatus = {
        ...currentStatus,
        [stepId]: true
      }
      
      // Check if all steps are complete
      const allComplete = onboardingSteps.every(step => 
        updatedStatus[step.id as keyof typeof updatedStatus] === true
      )
      
      if (allComplete) {
        updatedStatus.completedAt = new Date()
      }
      
      const result = await updateUserOnboardingAction(userId, updatedStatus)
      
      if (result.isSuccess) {
        setCurrentStatus(updatedStatus)
        toast.success("Progress saved!")
        
        if (allComplete) {
          toast.success("Onboarding completed! Welcome to AI Summer Camp!")
          setTimeout(() => setIsOpen(false), 2000)
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("[OnboardingModal] Error updating status:", error)
      toast.error("Failed to save progress")
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Welcome to AI Summer Camp!</DialogTitle>
          <DialogDescription>
            Let's get you set up with the essential tools you'll need for the program.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Setup Progress</span>
              <span>{completedSteps} of {onboardingSteps.length} complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Steps */}
          <div className="space-y-4">
            {onboardingSteps.map((step) => {
              const isComplete = currentStatus[step.id as keyof typeof currentStatus] === true
              
              return (
                <Card key={step.id} className={isComplete ? "border-green-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(step.link, "_blank")}
                          >
                            {step.linkText}
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                          {!isComplete && (
                            <Button
                              size="sm"
                              onClick={() => handleStepComplete(step.id)}
                              disabled={isUpdating}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={completedSteps === 0}
          >
            {completedSteps === onboardingSteps.length ? "Close" : "Continue Later"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 