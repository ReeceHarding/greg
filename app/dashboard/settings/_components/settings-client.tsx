"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Shield, User, Save, Loader2 } from "lucide-react"
import { FirebaseProfile } from "@/types/firebase-types"
import { useRouter } from "next/navigation"

interface SettingsClientProps {
  userId: string
  profile: FirebaseProfile
  isAdmin: boolean
}

export default function SettingsClient({ userId, profile, isAdmin }: SettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  // View mode state - default to student view
  const [viewMode, setViewMode] = useState<"student" | "admin">("student")
  
  console.log("[SettingsClient] Rendering with isAdmin:", isAdmin)
  
  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem("viewMode")
    if (savedViewMode === "admin" && isAdmin) {
      setViewMode("admin")
    }
  }, [isAdmin])
  
  // Handle view mode change
  const handleViewModeChange = (checked: boolean) => {
    const newMode = checked ? "admin" : "student"
    console.log("[SettingsClient] Changing view mode to:", newMode)
    
    setViewMode(newMode)
    localStorage.setItem("viewMode", newMode)
    
    // Show toast notification
    toast({
      title: "View Mode Changed",
      description: `You are now viewing the app as ${newMode === "admin" ? "an administrator" : "a student"}`,
    })
    
    // Redirect to appropriate dashboard after a short delay
    setTimeout(() => {
      if (newMode === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }, 1000)
  }
  
  // Handle save preferences
  const handleSavePreferences = async () => {
    console.log("[SettingsClient] Saving preferences")
    setIsSaving(true)
    
    try {
      // In a real implementation, you would save these preferences to the database
      // For now, we'll just show a success message
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      })
    } catch (error) {
      console.error("[SettingsClient] Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Display Name</Label>
            <p className="font-medium">{profile.displayName || "Not set"}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Membership</Label>
            <p className="font-medium capitalize">{profile.membership}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* View Mode Switcher - Only show if user is admin */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>View Mode</CardTitle>
            <CardDescription>
              Switch between student and administrator views
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${viewMode === "student" ? "bg-primary/10" : "bg-muted"}`}>
                  <User className={`w-6 h-6 ${viewMode === "student" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium">Student View</p>
                  <p className="text-sm text-muted-foreground">
                    Experience the platform as a student
                  </p>
                </div>
              </div>
              
              <Switch
                checked={viewMode === "admin"}
                onCheckedChange={handleViewModeChange}
                className="data-[state=checked]:bg-primary"
              />
              
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-right">Admin View</p>
                  <p className="text-sm text-muted-foreground text-right">
                    Access administrative features
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${viewMode === "admin" ? "bg-primary/10" : "bg-muted"}`}>
                  <Shield className={`w-6 h-6 ${viewMode === "admin" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
              </div>
            </div>
            
            <div className={`mt-4 p-4 rounded-lg ${viewMode === "admin" ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"}`}>
              <p className="text-sm">
                {viewMode === "admin" ? (
                  <>
                    <span className="font-medium">Admin Mode Active:</span> You have access to all administrative features including student management, analytics, and content moderation.
                  </>
                ) : (
                  <>
                    <span className="font-medium">Student Mode Active:</span> You're viewing the platform as a regular student would see it, without administrative privileges.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about assignments and announcements
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="progress-reminders">Progress Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded when you haven't made progress in a while
              </p>
            </div>
            <Switch id="progress-reminders" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="achievement-notifications">Achievement Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Be notified when you earn new badges or achievements
              </p>
            </div>
            <Switch id="achievement-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 