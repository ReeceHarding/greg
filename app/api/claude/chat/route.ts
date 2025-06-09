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
    // Check for API key first
    if (!process.env.CLAUDE_API_KEY) {
      console.error("[Claude API] Missing CLAUDE_API_KEY environment variable")
      return new Response("Claude API not configured", { status: 500 })
    }
    
    // Authenticate user
    const authResult = await auth()
    if (!authResult.user) {
      console.log("[Claude API] Unauthorized request")
      return new Response("Unauthorized", { status: 401 })
    }
    
    const { message, chatHistory = [], videoId, chatId } = await request.json()
    
    console.log(`[Claude Chat API] Received message: ${message.substring(0, 100)}...`)
    console.log(`[Claude Chat API] Chat history length: ${chatHistory.length}`)
    console.log(`[Claude Chat API] Video ID: ${videoId || 'none'}`)
    console.log(`[Claude Chat API] Chat ID: ${chatId || 'none'}`)
    
    // Generate a consistent chatId if not provided
    const currentChatId = chatId || `chat_${authResult.user.uid}_${videoId || 'general'}_${new Date().toISOString().split('T')[0]}`
    
    // Get video context if available
    let videoData = null
    let relevantChunks: TranscriptChunk[] = []
    let searchedVideoIds: string[] = []
    
    if (videoId) {
      console.log(`[Claude Chat API] Fetching video data for: ${videoId}`)
      const videoResult = await getVideoByIdAction(videoId)
      
      if (videoResult.isSuccess && videoResult.data) {
        videoData = videoResult.data
        console.log(`[Claude Chat API] Found video: ${videoData.title}`)
        
        // Search for relevant transcript chunks in the specific video
        console.log(`[Claude Chat API] Searching for relevant transcript chunks in video...`)
        const searchResult = await searchTranscriptChunksAction(message, videoId, 5)
        
        if (searchResult.isSuccess && searchResult.data && searchResult.data.length > 0) {
          relevantChunks = searchResult.data
          searchedVideoIds = [videoId]
          console.log(`[Claude Chat API] Found ${relevantChunks.length} relevant chunks in video`)
        }
      }
    } else {
      // No specific video context - search across all videos
      console.log(`[Claude Chat API] No video context, searching across all videos...`)
      const searchResult = await searchTranscriptChunksAction(message, undefined, 5)
      
      if (searchResult.isSuccess && searchResult.data && searchResult.data.length > 0) {
        relevantChunks = searchResult.data
        console.log(`[Claude Chat API] Found ${relevantChunks.length} relevant chunks across all videos`)
        
        // Note: In a real implementation, we'd need to enhance the search to return video IDs
        // For now, we'll note this as a limitation
        console.log(`[Claude Chat API] Note: Cross-video search results don't include video metadata`)
      }
    }
    
    // Build system message with video context
    let systemMessage = `You are an AI assistant helping students in the AI Summer Camp program. Be helpful, encouraging, and provide specific actionable advice.`
    
    if (videoData) {
      systemMessage += `\n\nYou are currently discussing the video: "${videoData.title}"`
      systemMessage += `\nVideo URL: https://youtube.com/watch?v=${videoData.videoId}`
      
      if (relevantChunks.length > 0) {
        systemMessage += `\n\nHere are the most relevant excerpts from the video transcript based on the user's question:`
        relevantChunks.forEach((chunk, index) => {
          const startTime = Math.floor(chunk.startTime)
          const endTime = Math.floor(chunk.endTime)
          const startMinutes = Math.floor(startTime / 60)
          const startSeconds = startTime % 60
          const endMinutes = Math.floor(endTime / 60)
          const endSeconds = endTime % 60
          const startTimestamp = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`
          const endTimestamp = `${endMinutes}:${endSeconds.toString().padStart(2, '0')}`
          
          systemMessage += `\n\n**[${startTimestamp} - ${endTimestamp}]**\n${chunk.text}`
        })
        systemMessage += `\n\nIMPORTANT: When referencing specific parts of the video in your response, include clickable timestamps in the format [MM:SS] that students can click to jump directly to that part of the video. The timestamps will be automatically converted to clickable links.`
        systemMessage += `\n\nExample: "As mentioned at [2:45], Greg explains the importance of finding your first customers..."`
      }
    } else if (relevantChunks.length > 0) {
      // Found relevant content across multiple videos
      systemMessage += `\n\nI found relevant content from the video library based on your question:`
      relevantChunks.forEach((chunk, index) => {
        const startTime = Math.floor(chunk.startTime)
        const endTime = Math.floor(chunk.endTime)
        const startMinutes = Math.floor(startTime / 60)
        const startSeconds = startTime % 60
        const endMinutes = Math.floor(endTime / 60)
        const endSeconds = endTime % 60
        const startTimestamp = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`
        const endTimestamp = `${endMinutes}:${endSeconds.toString().padStart(2, '0')}`
        
        systemMessage += `\n\n**[${startTimestamp} - ${endTimestamp}]**\n${chunk.text}`
      })
      systemMessage += `\n\nNote: These excerpts are from various videos in the course. I recommend watching the full videos for complete context.`
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
- Encourage students to apply what they learn
- Use markdown formatting for better readability (headers, lists, bold, etc.)
- When appropriate, use emojis to make the conversation more engaging
- Keep responses concise but comprehensive`
    
    console.log("[Claude API] Calling Claude API with streaming")
    
    // Save user message immediately
    try {
      await createChatMessageAction({
        chatId: currentChatId,
        userId: authResult.user.uid,
        role: "user",
        content: message,
        videoId: videoId || undefined
      })
      console.log("[Claude API] User message saved to database")
    } catch (error) {
      console.error("[Claude API] Error saving user message:", error)
      // Continue even if saving fails
    }
    
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
            
            // Parse error for better user feedback
            let errorMessage = "Failed to get response from AI"
            try {
              const errorData = JSON.parse(error)
              if (errorData.error?.message) {
                errorMessage = errorData.error.message
              }
            } catch (e) {
              // Use default error message
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: errorMessage
            })}\n\n`))
            controller.close()
            return
          }
          
          const reader = response.body?.getReader()
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: "No response body"
            })}\n\n`))
            controller.close()
            return
          }
          
          let assistantMessage = ""
          const decoder = new TextDecoder()
          let buffer = ""
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            // Add to buffer
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            
            // Process all complete lines
            buffer = lines.pop() || "" // Keep the last incomplete line in buffer
            
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
                    // Save the complete assistant message
                    console.log("[Claude API] Stream complete, saving assistant message")
                    
                    try {
                      await createChatMessageAction({
                        chatId: currentChatId,
                        userId: authResult.user.uid,
                        role: "assistant",
                        content: assistantMessage,
                        videoId: videoId || undefined
                      })
                      console.log("[Claude API] Assistant message saved to database")
                    } catch (error) {
                      console.error("[Claude API] Error saving assistant message:", error)
                    }
                    
                    // Send completion signal with the chatId
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'done',
                      chatId: currentChatId
                    })}\n\n`))
                  } else if (parsed.type === 'error') {
                    console.error("[Claude API] Stream error:", parsed)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'error',
                      message: parsed.error?.message || 'Stream error'
                    })}\n\n`))
                  }
                } catch (e) {
                  console.error("[Claude API] Error parsing SSE data:", e)
                }
              }
            }
          }
          
          // Process any remaining buffer
          if (buffer.length > 0) {
            console.log("[Claude API] Processing remaining buffer:", buffer)
          }
          
          controller.close()
        } catch (error) {
          console.error("[Claude API] Stream error:", error)
          const errorMessage = error instanceof Error ? error.message : "Stream error"
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: errorMessage
          })}\n\n`))
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
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return new Response(errorMessage, { status: 500 })
  }
} 