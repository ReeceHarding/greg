"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FirebaseVideo } from "@/types/firebase-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Clock, Eye, Calendar, Hash } from "lucide-react"
import { format } from "date-fns"

interface VideoDetailClientProps {
  video: FirebaseVideo
}

export default function VideoDetailClient({ video }: VideoDetailClientProps) {
  const router = useRouter()
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false)
  
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
  
  // Parse published date
  const publishedDate = video.publishedAt ? 
    (video.publishedAt as any).toDate?.() || new Date(video.publishedAt as any) : 
    new Date()
  
  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}`}
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
            <Button onClick={handleAskAI} className="shrink-0">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(publishedDate, "MMM d, yyyy")}
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
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="whitespace-pre-wrap text-sm">
                  {video.description || "No description available."}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transcript" className="mt-4">
              {video.transcript ? (
                <div>
                  <ScrollArea className={`w-full pr-4 ${isTranscriptExpanded ? 'h-[600px]' : 'h-[400px]'}`}>
                    <div className="space-y-4">
                      {video.transcriptChunks && video.transcriptChunks.length > 0 ? (
                        video.transcriptChunks.map((chunk, index) => (
                          <div key={chunk.chunkId} className="pb-4 border-b last:border-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              {formatDuration(Math.floor(chunk.startTime))} - {formatDuration(Math.floor(chunk.endTime))}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{chunk.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {video.transcript}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                    >
                      {isTranscriptExpanded ? "Show Less" : "Show More"}
                    </Button>
                  </div>
                </div>
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