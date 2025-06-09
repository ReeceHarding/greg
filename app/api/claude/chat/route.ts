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
  const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\]|\))?/g
  
  return text.replace(timestampRegex, (match, hours, minutes, seconds) => {
    let totalSeconds = 0
    
    if (seconds) {
      // Format: HH:MM:SS
      totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
    } else {
      // Format: MM:SS
      totalSeconds = parseInt(hours) * 60 + parseInt(minutes)
    }
    
    // Create a clickable timestamp link
    return `[${match}](timestamp:${totalSeconds})`
  })
}

export async function POST(request: NextRequest) {
  console.log("[Claude API] Received chat request")
  
  try {
    // Authenticate user
    const authResult = await auth()
    if (!authResult.user) {
      console.log("[Claude API] Unauthorized request")
      return new Response("Unauthorized", { status: 401 })
    }
    
    const { message, chatHistory = [], videoId } = await request.json()
    
    console.log(`[Claude Chat API] Received message: ${message.substring(0, 100)}...`)
    console.log(`[Claude Chat API] Chat history length: ${chatHistory.length}`)
    console.log(`[Claude Chat API] Video ID: ${videoId || 'none'}`)
    
    // Get video context if available
    let videoData = null
    let relevantChunks: TranscriptChunk[] = []
    
    if (videoId) {
      console.log(`[Claude Chat API] Fetching video data for: ${videoId}`)
      const videoResult = await getVideoByIdAction(videoId)
      
      if (videoResult.isSuccess && videoResult.data) {
        videoData = videoResult.data
        console.log(`[Claude Chat API] Found video: ${videoData.title}`)
        
        // Search for relevant transcript chunks
        console.log(`[Claude Chat API] Searching for relevant transcript chunks...`)
        const searchResult = await searchTranscriptChunksAction(message, videoId, 5)
        
        if (searchResult.isSuccess && searchResult.data) {
          relevantChunks = searchResult.data
          console.log(`[Claude Chat API] Found ${relevantChunks.length} relevant chunks`)
        }
      }
    }
    
    // Build system message with video context
    let systemMessage = `You are an AI assistant helping students in the AI Summer Camp program. Be helpful, encouraging, and provide specific actionable advice.`
    
    if (videoData) {
      systemMessage += `\n\nYou are currently discussing the video: "${videoData.title}"`
      
      if (relevantChunks.length > 0) {
        systemMessage += `\n\nHere are relevant excerpts from the video transcript:`
        relevantChunks.forEach((chunk, index) => {
          const startTime = Math.floor(chunk.startTime)
          const minutes = Math.floor(startTime / 60)
          const seconds = startTime % 60
          const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`
          
          systemMessage += `\n\n[${timestamp}] ${chunk.text}`
        })
        systemMessage += `\n\nWhen referencing specific parts of the video, include timestamps in the format [MM:SS] so students can click to jump to that part.`
      }
    }
    
    // Build messages for Claude
    const messages: Array<{ role: string; content: string }> = []
    
    // Add chat history
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }
    
    // Add current message
    messages.push({
      role: "user",
      content: message
    })
    
    // Build system prompt
    const systemPrompt = `You are an AI tutor helping students learn from educational content about startups, business, and entrepreneurship. 

${systemMessage}

Guidelines:
- Be encouraging and supportive
- Provide clear, actionable insights
- Use examples when helpful
- If discussing video content, reference specific timestamps when available
- Format timestamps as [MM:SS] for easy reference
- Break down complex concepts into understandable parts
- Encourage students to apply what they learn`
    
    console.log("[Claude API] Calling Claude API with streaming")
    
    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call Claude API
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": process.env.CLAUDE_API_KEY!,
              "anthropic-version": "2023-06-01",
              "anthropic-beta": "interleaved-thinking-2025-05-14"
            },
            body: JSON.stringify({
              model: CLAUDE_MODEL,
              messages: messages,
              system: systemPrompt,
              max_tokens: 4096,
              stream: true,
              temperature: 0.7
            })
          })
          
          if (!response.ok) {
            const error = await response.text()
            console.error("[Claude API] Error from Claude:", error)
            controller.enqueue(encoder.encode(`data: {"error": "Failed to get response from AI"}\n\n`))
            controller.close()
            return
          }
          
          const reader = response.body?.getReader()
          if (!reader) {
            controller.enqueue(encoder.encode(`data: {"error": "No response body"}\n\n`))
            controller.close()
            return
          }
          
          let assistantMessage = ""
          const decoder = new TextDecoder()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6)
                if (data === '[DONE]') continue
                
                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    assistantMessage += parsed.delta.text
                    
                    // Parse timestamps if video context exists
                    const parsedContent = parseTimestamps(parsed.delta.text, videoId)
                    
                    // Forward the chunk to the client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'text',
                      text: parsedContent
                    })}\n\n`))
                  } else if (parsed.type === 'message_stop') {
                    // Save the complete message to database
                    console.log("[Claude API] Saving messages to database")
                    
                    // Save user message
                    if (authResult.user) {
                      await createChatMessageAction({
                        chatId: `chat_${Date.now()}`,
                        userId: authResult.user.uid,
                        role: "user",
                        content: message,
                        videoId: videoId || undefined
                      })
                    }
                    
                    // Save assistant message
                    if (authResult.user) {
                      await createChatMessageAction({
                        chatId: `chat_${Date.now()}`,
                        userId: authResult.user.uid,
                        role: "assistant",
                        content: assistantMessage,
                        videoId: videoId || undefined
                      })
                    }
                    
                    // Send completion signal
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'done',
                      chatId: `chat_${Date.now()}`
                    })}\n\n`))
                  }
                } catch (e) {
                  console.error("[Claude API] Error parsing SSE data:", e)
                }
              }
            }
          }
          
          controller.close()
        } catch (error) {
          console.error("[Claude API] Stream error:", error)
          controller.enqueue(encoder.encode(`data: {"error": "Stream error"}\n\n`))
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })
    
  } catch (error) {
    console.error("[Claude API] Error:", error)
    return new Response("Internal server error", { status: 500 })
  }
} 