import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/firebase-auth"
import { createChatMessageAction, getChatHistoryAction } from "@/actions/db/chat-actions"
import { getVideoByIdAction } from "@/actions/videos/video-actions"
import { searchTranscriptChunksAction } from "@/actions/ai/pinecone-actions"
import { TranscriptChunk } from "@/types/firebase-types"

// Claude 4 Sonnet model
const CLAUDE_MODEL = "claude-sonnet-4-20250514"

// Function to parse timestamps in text and convert to links
function parseTimestamps(text: string, videoId?: string): string {
  if (!videoId) return text
  
  // Match various timestamp formats: [0:45], (2:30), 1:23:45, etc.
  const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?/g
  
  return text.replace(timestampRegex, (match, hours, minutes, seconds) => {
    let totalSeconds = parseInt(minutes) * 60
    if (hours.length <= 2 && parseInt(hours) < 60) {
      totalSeconds += parseInt(hours) * 60
    } else {
      totalSeconds = parseInt(hours) * 60 + parseInt(minutes)
    }
    if (seconds) {
      totalSeconds += parseInt(seconds)
    }
    
    return `[${match}](timestamp:${totalSeconds})`
  })
}

// Build system prompt for Greg AI
function buildSystemPrompt(videoTitle?: string, hasSubmission?: boolean): string {
  const basePrompt = `You are Greg AI, an AI coaching assistant based on Greg Isenberg's entrepreneurship teachings. You help students succeed in their startup journey by providing actionable advice, feedback on their work, and guidance based on Greg's methodology.

Key principles you follow:
1. Be encouraging but honest - provide constructive feedback that helps students improve
2. Focus on practical, actionable advice that students can implement immediately
3. Reference specific concepts from Greg's teachings when relevant
4. Help students think like entrepreneurs - validate ideas, find customers, build MVPs
5. Emphasize the importance of shipping fast and iterating based on feedback

When discussing videos:
- Reference specific timestamps when mentioning concepts
- Provide actionable takeaways from the content
- Connect video lessons to the student's current work

When reviewing submissions:
- Acknowledge what they did well first
- Provide specific, actionable feedback for improvement
- Suggest next steps based on their progress
- Reference relevant course materials or videos that could help
- Give a balanced assessment that motivates continued learning

Always maintain a supportive, coach-like tone that encourages students to take action and iterate quickly.`

  if (videoTitle) {
    return `${basePrompt}\n\nCurrently discussing the video: "${videoTitle}". Feel free to reference specific concepts and timestamps from this video when relevant.`
  }
  
  if (hasSubmission) {
    return `${basePrompt}\n\nThe student has shared a submission for feedback. Provide detailed, constructive feedback that helps them improve while acknowledging their effort and progress.`
  }
  
  return basePrompt
}

// Format submission for context
function formatSubmissionContext(submission: any): string {
  let context = `\n\nSubmission Details:
- Week ${submission.weekNumber || '?'}: ${submission.assignmentTitle || 'Assignment'}
- Status: ${submission.status}
- Submission Content:`
  
  if (submission.content.videoUrl) {
    context += `\n  - Video Demo: ${submission.content.videoUrl}`
  }
  if (submission.content.githubUrl) {
    context += `\n  - GitHub Repository: ${submission.content.githubUrl}`
  }
  if (submission.content.reflection) {
    context += `\n  - Reflection: ${submission.content.reflection}`
  }
  
  if (submission.aiFeedback) {
    context += `\n\nPrevious AI Feedback:
- Score: ${submission.aiFeedback.overallScore}/10
- Strengths: ${submission.aiFeedback.strengths.join(', ')}
- Areas for Improvement: ${submission.aiFeedback.improvements.join(', ')}
- Next Steps: ${submission.aiFeedback.nextSteps.join(', ')}`
  }
  
  if (submission.instructorFeedback) {
    context += `\n\nInstructor Feedback:
${submission.instructorFeedback.comments}`
  }
  
  return context
}

export async function POST(request: NextRequest) {
  console.log("[Claude Chat API] Received chat request")
  
  try {
    const { 
      message, 
      userId, 
      chatId, 
      videoId, 
      videoTitle,
      selectedSubmission 
    } = await request.json()
    
    console.log("[Claude Chat API] Request params:", {
      hasMessage: !!message,
      userId,
      chatId,
      hasVideo: !!videoId,
      hasSubmission: !!selectedSubmission
    })
    
    // Validate required fields
    if (!message || !userId || !chatId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      console.error("[Claude Chat API] CLAUDE_API_KEY not configured")
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 503 }
      )
    }
    
    // Build the system prompt
    const systemPrompt = buildSystemPrompt(videoTitle, !!selectedSubmission)
    
    // Build the user message with context
    let fullMessage = message
    if (selectedSubmission) {
      fullMessage += formatSubmissionContext(selectedSubmission)
    }
    
    // Search for relevant video content if we have a video context
    let relevantChunks: TranscriptChunk[] = []
    if (videoId || (!selectedSubmission && message.toLowerCase().includes('video'))) {
      console.log("[Claude Chat API] Searching for relevant video content")
      const searchResult = await searchTranscriptChunksAction(message, videoId, 5)
      if (searchResult.isSuccess && searchResult.data) {
        relevantChunks = searchResult.data
        console.log(`[Claude Chat API] Found ${relevantChunks.length} relevant video chunks`)
      }
    }
    
    // Add relevant video context to the message
    if (relevantChunks.length > 0) {
      fullMessage += "\n\nRelevant video content:"
      relevantChunks.forEach(chunk => {
        const timestamp = Math.floor(chunk.startTime)
        const minutes = Math.floor(timestamp / 60)
        const seconds = timestamp % 60
        fullMessage += `\n\n[${minutes}:${seconds.toString().padStart(2, '0')}]${videoTitle ? ` from "${videoTitle}"` : ''}:\n${chunk.text}`
      })
    }
    
    console.log("[Claude Chat API] Calling Claude API")
    
    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: fullMessage
          }
        ],
        stream: true
      })
    })
    
    console.log("[Claude Chat API] Claude API response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Claude Chat API] Claude API error:", errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }
    
    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (!reader) {
          controller.close()
          return
        }
        
        let buffer = ""
        let fullResponse = ""
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue
                
                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    const text = parsed.delta.text
                    fullResponse += text
                    
                    // Send the text chunk
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                    )
                  }
                } catch (e) {
                  console.error("[Claude Chat API] Error parsing SSE data:", e)
                }
              }
            }
          }
          
          // Process the response for video recommendations if we have a specific video
          if (fullResponse && videoId && videoTitle) {
            // Look for timestamp references in the response
            const timestampRegex = /\[(\d{1,2}):(\d{2})\]/g
            let hasTimestamps = false
            
            // Check if response contains timestamps
            if (timestampRegex.test(fullResponse)) {
              hasTimestamps = true
              
              // Send a recommendation for the current video with timestamps
              const videoRecommendations = [{
                title: videoTitle,
                videoId: videoId
              }]
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ videoRecommendations })}\n\n`)
              )
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        } catch (error) {
          console.error("[Claude Chat API] Stream processing error:", error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream processing error" })}\n\n`)
          )
        } finally {
          controller.close()
        }
      }
    })
    
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })
  } catch (error) {
    console.error("[Claude Chat API] Error:", error)
    
    // Return a proper error response
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process chat request",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    )
  }
} 