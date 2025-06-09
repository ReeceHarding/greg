"use client"

import { useState } from "react"
import { SerializedFirebaseLiveSession } from "@/types/firebase-types"
import { registerForSessionAction, unregisterFromSessionAction } from "@/actions/db/sessions-actions"
import { auth } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Calendar, Clock, Users, Video, ExternalLink, User } from "lucide-react"
import { format } from "date-fns"
import { useAuthState } from "react-firebase-hooks/auth"

interface SessionsClientProps {
  sessions: SerializedFirebaseLiveSession[]
}

// Google Calendar embed configuration
const CALENDAR_ID = "aisummercamp@gmail.com" // Replace with actual calendar ID
const CALENDAR_EMBED_URL = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=America/New_York&mode=AGENDA&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=1`

export default function SessionsClient({ sessions }: SessionsClientProps) {
  const [user] = useAuthState(auth)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState(sessions)
  
  console.log(`[SessionsClient] Rendering ${sessions.length} sessions`)
  
  // Filter upcoming sessions
  const upcomingSessions = userSessions.filter(session => {
    const sessionDate = session.scheduledAt ? 
      (session.scheduledAt as any).toDate?.() || new Date(session.scheduledAt as any) : 
      new Date()
    return sessionDate > new Date()
  })
  
  // Handle RSVP
  const handleRSVP = async (sessionId: string, isRegistered: boolean) => {
    if (!user) {
      toast.error("Please log in to RSVP for sessions")
      return
    }
    
    console.log(`[SessionsClient] ${isRegistered ? 'Unregistering' : 'Registering'} for session: ${sessionId}`)
    setIsProcessing(sessionId)
    
    try {
      const result = isRegistered
        ? await unregisterFromSessionAction(sessionId, user.uid)
        : await registerForSessionAction(sessionId, user.uid)
      
      if (result.isSuccess && result.data) {
        // Update local state
        setUserSessions(prev => 
          prev.map(s => s.sessionId === sessionId ? result.data : s)
        )
        toast.success(isRegistered ? "Unregistered from session" : "Registered for session!")
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("[SessionsClient] Error updating RSVP:", error)
      toast.error("Failed to update RSVP")
    } finally {
      setIsProcessing(null)
    }
  }
  
  // Get Zoom link (only show for registered users)
  const getZoomLink = (session: SerializedFirebaseLiveSession) => {
    if (!user || !session.registeredStudents.includes(user.uid)) {
      return null
    }
    return session.zoomLink
  }
  
  // Format session date
  const formatSessionDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp)
    return format(date, "EEE, MMM d, yyyy 'at' h:mm a")
  }
  
  return (
    <div className="space-y-8">
      {/* Google Calendar Embed */}
      <Card>
        <CardHeader>
          <CardTitle>Program Calendar</CardTitle>
          <CardDescription>
            View all upcoming sessions and events in the calendar below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] rounded-lg overflow-hidden border">
            <iframe
              src={CALENDAR_EMBED_URL}
              className="w-full h-full"
              frameBorder="0"
              scrolling="no"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
        
        {upcomingSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No upcoming sessions scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSessions.map((session) => {
              const isRegistered = user ? session.registeredStudents.includes(user.uid) : false
              const zoomLink = getZoomLink(session)
              const sessionDate = session.scheduledAt ? 
                (session.scheduledAt as any).toDate?.() || new Date(session.scheduledAt as any) : 
                new Date()
              const isLive = new Date() >= sessionDate && new Date() <= new Date(sessionDate.getTime() + session.duration * 60000)
              
              return (
                <Card key={session.sessionId} className={isLive ? "border-green-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </div>
                      <Badge variant={session.type === "office_hours" ? "secondary" : "default"}>
                        {session.type === "office_hours" ? "Office Hours" : "Workshop"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Session Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatSessionDate(session.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{session.registeredStudents.length} registered</span>
                      </div>
                      {session.guestSpeaker && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Guest: {session.guestSpeaker.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Guest Speaker Info */}
                    {session.guestSpeaker && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium">{session.guestSpeaker.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.guestSpeaker.bio}
                        </p>
                        {session.guestSpeaker.profileUrl && (
                          <a
                            href={session.guestSpeaker.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                          >
                            View Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isRegistered ? "outline" : "default"}
                        onClick={() => handleRSVP(session.sessionId, isRegistered)}
                        disabled={isProcessing === session.sessionId}
                      >
                        {isProcessing === session.sessionId ? (
                          "Processing..."
                        ) : isRegistered ? (
                          "Cancel RSVP"
                        ) : (
                          "RSVP"
                        )}
                      </Button>
                      
                      {isRegistered && zoomLink && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(zoomLink, "_blank")}
                          disabled={!isLive && new Date() < sessionDate}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          {isLive ? "Join Now" : "Get Zoom Link"}
                        </Button>
                      )}
                    </div>
                    
                    {isLive && (
                      <Badge className="bg-green-500 text-white">
                        Live Now!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 