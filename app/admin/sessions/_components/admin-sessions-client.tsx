"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, Edit, Trash2, Calendar, Users, Link } from "lucide-react"
import { SerializedFirebaseLiveSession } from "@/types"
import { createLiveSessionAction, updateSessionAction, deleteSessionAction } from "@/actions/db/sessions-actions"
import { format } from "date-fns"

interface AdminSessionsClientProps {
  initialSessions: SerializedFirebaseLiveSession[]
}

// Extend the session type to include maxAttendees
interface ExtendedSession extends SerializedFirebaseLiveSession {
  maxAttendees?: number
}

export default function AdminSessionsClient({ initialSessions }: AdminSessionsClientProps) {
  const [sessions, setSessions] = useState<ExtendedSession[]>(initialSessions)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSession, setEditingSession] = useState<ExtendedSession | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60,
    zoomLink: "",
    zoomMeetingId: "",
    sessionType: "office_hours" as "office_hours" | "expert_workshop",
    maxAttendees: 50
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: 60,
      zoomLink: "",
      zoomMeetingId: "",
      sessionType: "office_hours",
      maxAttendees: 50
    })
    setEditingSession(null)
  }

  const handleEdit = (session: ExtendedSession) => {
    const date = new Date(session.scheduledAt)
    setFormData({
      title: session.title,
      description: session.description || "",
      date: format(date, "yyyy-MM-dd"),
      time: format(date, "HH:mm"),
      duration: session.duration,
      zoomLink: session.zoomLink || "",
      zoomMeetingId: session.zoomMeetingId || "",
      sessionType: session.type,
      maxAttendees: session.maxAttendees || 50
    })
    setEditingSession(session)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    console.log("[AdminSessionsClient] Submitting form:", formData)

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`)
      
      const sessionData: any = {
        title: formData.title,
        description: formData.description,
        scheduledAt: dateTime,
        duration: formData.duration,
        zoomLink: formData.zoomLink,
        zoomMeetingId: formData.zoomMeetingId,
        type: formData.sessionType,
        hostId: "admin", // You might want to get the actual admin ID
        maxAttendees: formData.maxAttendees
      }

      let result
      if (editingSession) {
        console.log("[AdminSessionsClient] Updating session:", editingSession.sessionId)
        result = await updateSessionAction(editingSession.sessionId, sessionData)
      } else {
        console.log("[AdminSessionsClient] Creating new session")
        result = await createLiveSessionAction(sessionData)
      }

      if (result.isSuccess && result.data) {
        const sessionWithMaxAttendees = { ...result.data, maxAttendees: formData.maxAttendees }
        
        if (editingSession) {
          // Update existing session in state
          setSessions(sessions.map(s => 
            s.sessionId === editingSession.sessionId ? sessionWithMaxAttendees : s
          ))
          toast({
            title: "Session Updated",
            description: "The session has been successfully updated."
          })
        } else {
          // Add new session to state
          setSessions([...sessions, sessionWithMaxAttendees])
          toast({
            title: "Session Created",
            description: "The new session has been successfully created."
          })
        }
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[AdminSessionsClient] Error submitting:", error)
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return
    
    setIsDeleting(sessionId)
    console.log("[AdminSessionsClient] Deleting session:", sessionId)

    try {
      const result = await deleteSessionAction(sessionId)
      
      if (result.isSuccess) {
        setSessions(sessions.filter(s => s.sessionId !== sessionId))
        toast({
          title: "Session Deleted",
          description: "The session has been successfully deleted."
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[AdminSessionsClient] Error deleting:", error)
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case "office_hours":
        return "Office Hours"
      case "expert_workshop":
        return "Expert Workshop"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Session */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? "Edit Session" : "Create New Session"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Office Hours with Greg"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Join us for an interactive Q&A session..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min={15}
                    max={240}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                    min={1}
                    max={1000}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value: any) => setFormData({ ...formData, sessionType: value })}
                >
                  <SelectTrigger id="sessionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_hours">Office Hours</SelectItem>
                    <SelectItem value="expert_workshop">Expert Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="zoomLink">Zoom Link</Label>
                <Input
                  id="zoomLink"
                  value={formData.zoomLink}
                  onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              
              <div>
                <Label htmlFor="zoomMeetingId">Zoom Meeting ID</Label>
                <Input
                  id="zoomMeetingId"
                  value={formData.zoomMeetingId}
                  onChange={(e) => setFormData({ ...formData, zoomMeetingId: e.target.value })}
                  placeholder="123-456-7890"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingSession ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingSession ? "Update Session" : "Create Session"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No sessions created yet. Create your first session to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                <div>Title</div>
                <div>Date & Time</div>
                <div>Type</div>
                <div>Attendees</div>
                <div>Actions</div>
              </div>
              
              {/* Table Rows */}
              {sessions.map((session) => (
                <div key={session.sessionId} className="grid grid-cols-5 gap-4 py-3 items-center">
                  <div>
                    <p className="font-medium">{session.title}</p>
                    {session.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {session.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(session.scheduledAt), "h:mm a")} ({session.duration} min)
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm">
                      {getSessionTypeLabel(session.type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    {session.registeredStudents.length} / {session.maxAttendees || 50}
                  </div>
                  
                  <div className="flex gap-2">
                    {session.zoomLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={session.zoomLink} target="_blank" rel="noopener noreferrer">
                          <Link className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(session)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(session.sessionId)}
                      disabled={isDeleting === session.sessionId}
                    >
                      {isDeleting === session.sessionId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 