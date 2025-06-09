"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SerializedFirebaseVideo } from "@/types/firebase-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Clock, Eye, Calendar, Hash, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import VideoTranscript from "./video-transcript"
import VideoDescriptionFormatter from "./video-description-formatter"

interface VideoDetailClientProps {
  video: SerializedFirebaseVideo
}

export default function VideoDetailClient({ video }: VideoDetailClientProps) {
  const router = useRouter()
  const playerRef = useRef<HTMLIFrameElement>(null)
  const [playerReady, setPlayerReady] = useState(false)
  
  console.log(`[VideoDetailClient] Rendering video: ${video.title}`)
  
  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle AI Assistant button click
  const handleAskAI = () => {
    console.log(`[VideoDetailClient] Opening AI chat for video: ${video.videoId}`)
    // Navigate to chat with video context
    router.push(`/dashboard/chat?videoId=${video.videoId}`)
  }
  
  // Handle seeking to specific time in video
  const handleSeekToTime = (timeInSeconds: number) => {
    console.log(`[VideoDetailClient] Seeking to ${timeInSeconds} seconds`)
    
    if (playerRef.current) {
      // Use YouTube iframe API to seek
      playerRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [timeInSeconds, true]
        }),
        '*'
      )
    }
  }
  
  // Parse published date - handle potential invalid dates
  const publishedDate = video.publishedAt ? new Date(video.publishedAt) : new Date()
  const isValidDate = publishedDate instanceof Date && !isNaN(publishedDate.getTime())
  
  // Check for timestamp in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const timestamp = params.get('t')
    
    if (timestamp && playerReady) {
      const seconds = parseInt(timestamp)
      if (!isNaN(seconds)) {
        handleSeekToTime(seconds)
      }
    }
  }, [playerReady])
  
  // Listen for YouTube player ready
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return
      
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'onReady') {
          setPlayerReady(true)
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="aspect-video w-full">
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.videoId}?enablejsapi=1`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>
      
      {/* Video Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{video.title}</CardTitle>
              <CardDescription className="mt-2">{video.channelTitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              {video.videoUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(video.videoUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open on YouTube
                </Button>
              )}
              <Button onClick={handleAskAI} className="shrink-0">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {isValidDate ? format(publishedDate, "MMM d, yyyy") : "Date unavailable"}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDuration(video.duration)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {video.viewCount.toLocaleString()} views
            </div>
          </div>
          
          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {video.tags.slice(0, 10).map((tag, index) => (
                <Badge key={index} variant="secondary">
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs for Description and Transcript */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="transcript">
                Transcript
                {!video.transcript && " (Not Available)"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-4">
              <VideoDescriptionFormatter 
                description={video.description || "No description available."}
                onTimestampClick={handleSeekToTime}
              />
            </TabsContent>
            
            <TabsContent value="transcript" className="mt-4">
              {video.transcript ? (
                <VideoTranscript 
                  transcript={video.transcript}
                  transcriptChunks={video.transcriptChunks || []}
                  onSeekToTime={handleSeekToTime}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">Transcript not available for this video.</p>
                  <p className="text-sm">Transcripts are automatically extracted when available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 