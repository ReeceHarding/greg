"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Search, ChevronDown, ChevronUp } from "lucide-react"
import { TranscriptChunk } from "@/types/firebase-types"
import { Input } from "@/components/ui/input"

interface VideoTranscriptProps {
  transcript: string
  transcriptChunks: TranscriptChunk[]
  onSeekToTime?: (timeInSeconds: number) => void
}

export default function VideoTranscript({ 
  transcript, 
  transcriptChunks,
  onSeekToTime 
}: VideoTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)

  // Filter chunks based on search
  const filteredChunks = transcriptChunks.filter(chunk =>
    chunk.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle clicking on a timestamp
  const handleTimeClick = (startTime: number, chunkId: string) => {
    console.log(`[VideoTranscript] Seeking to ${startTime} seconds`)
    setSelectedChunk(chunkId)
    
    if (onSeekToTime) {
      onSeekToTime(startTime)
    } else {
      // If no seek handler provided, update the URL to include timestamp
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('t', startTime.toString())
      window.history.replaceState({}, '', currentUrl.toString())
      
      // Also try to control the YouTube player if embedded
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [startTime, true]
          }),
          '*'
        )
      }
    }
  }

  if (!transcript || transcriptChunks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No transcript available for this video</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Video Transcript</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand
              </>
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!isExpanded ? (
          // Collapsed view - show preview
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {transcript.substring(0, 300)}...
            </p>
            <p className="text-xs text-muted-foreground">
              Click expand to view full transcript with timestamps
            </p>
          </div>
        ) : (
          // Expanded view - show chunks with timestamps
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredChunks.map((chunk) => (
              <div
                key={chunk.chunkId}
                className={`
                  group relative border rounded-lg p-4 cursor-pointer
                  transition-all duration-200
                  ${selectedChunk === chunk.chunkId 
                    ? 'border-purple-500 bg-purple-50/50' 
                    : 'border-border hover:border-purple-300 hover:bg-purple-50/30'
                  }
                `}
                onClick={() => handleTimeClick(chunk.startTime, chunk.chunkId)}
              >
                {/* Timestamp button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -left-2 -top-2 bg-white border shadow-sm 
                           hover:bg-purple-50 hover:border-purple-300
                           flex items-center gap-1.5 px-2 py-1 h-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimeClick(chunk.startTime, chunk.chunkId)
                  }}
                >
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {formatTime(chunk.startTime)}
                  </span>
                </Button>

                {/* Transcript text */}
                <p className="text-sm leading-relaxed pt-2">
                  {searchQuery && (
                    // Highlight search terms
                    chunk.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
                          {part}
                        </mark>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    ))
                  ) || chunk.text}
                </p>

                {/* Time range indicator */}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTime(chunk.startTime)} - {formatTime(chunk.endTime)}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to jump to this part
                  </span>
                </div>
              </div>
            ))}

            {filteredChunks.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No matches found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 