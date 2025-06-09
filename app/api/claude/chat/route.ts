import { NextRequest } from "next/server"
import { auth } from "@/lib/firebase-auth"
import { createChatMessageAction, getChatHistoryAction } from "@/actions/db/chat-actions"
import { getVideoByIdAction } from "@/actions/videos/video-actions"
import { searchTranscriptChunksAction } from "@/actions/ai/pinecone-actions"

// Claude 4 Sonnet model
const CLAUDE_MODEL = "claude-sonnet-4-20250514"

export async function POST(request: NextRequest) {
  console.log("[Claude API] Received chat request")
  
  try {
    // Authenticate user
    const authResult = await auth()
    if (!authResult.user) {
      console.log("[Claude API] Unauthorized request")
      return new Response("Unauthorized", { status: 401 })
    }
    
    const body = await request.json()
    const { message, videoId, chatId } = body
    
    if (!message || typeof message !== "string") {
      console.log("[Claude API] Invalid message")
      return new Response("Message is required", { status: 400 })
    }
    
    console.log(`[Claude API] Processing message for user: ${authResult.user.uid}`)
    console.log(`[Claude API] Video context: ${videoId || "none"}`)
    
    // Get chat history if chatId provided
    let chatHistory: Array<{ role: string; content: string }> = []
    if (chatId) {
      const historyResult = await getChatHistoryAction(chatId, authResult.user.uid)
      if (historyResult.isSuccess && historyResult.data) {
        chatHistory = historyResult.data.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }
    }
    
    // Build context if video is provided
    let context = ""
    let videoData = null
    
    if (videoId) {
      console.log(`[Claude API] Fetching video data for: ${videoId}`)
      
      // Get video details
      const videoResult = await getVideoByIdAction(videoId)
      if (videoResult.isSuccess && videoResult.data) {
        videoData = videoResult.data
        
        // Search for relevant transcript chunks
        console.log("[Claude API] Searching for relevant transcript chunks")
        const searchResult = await searchTranscriptChunksAction(message, videoId, 5)
        
        if (searchResult.isSuccess && searchResult.data && searchResult.data.length > 0) {
          context = `You are helping a student understand content from a video titled "${videoData.title}".

Video Description: ${videoData.description}

Relevant transcript excerpts:
${searchResult.data.map((chunk) => 
  `[${Math.floor(chunk.startTime / 60)}:${String(Math.floor(chunk.startTime % 60)).padStart(2, '0')} - ${Math.floor(chunk.endTime / 60)}:${String(Math.floor(chunk.endTime % 60)).padStart(2, '0')}]
${chunk.text}`
).join('\n\n')}

When referencing specific parts of the video, include timestamps in your response using the format [MM:SS]. These will be converted to clickable links.`
        } else {
          // Fallback to basic video info if no transcript chunks found
          context = `You are helping a student understand content from a video titled "${videoData.title}".
          
Video Description: ${videoData.description}

Note: Transcript is not available for this video, so please base your response on the video title and description.`
        }
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

${context || "Help the student with their questions about the course material."}

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
                    
                    // Forward the chunk to the client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'text',
                      text: parsed.delta.text
                    })}\n\n`))
                  } else if (parsed.type === 'message_stop') {
                    // Save the complete message to database
                    console.log("[Claude API] Saving messages to database")
                    
                    // Save user message
                    if (authResult.user) {
                      await createChatMessageAction({
                        chatId: chatId || `chat_${Date.now()}`,
                        userId: authResult.user.uid,
                        role: "user",
                        content: message,
                        videoId: videoId || undefined
                      })
                    }
                    
                    // Save assistant message
                    if (authResult.user) {
                      await createChatMessageAction({
                        chatId: chatId || `chat_${Date.now()}`,
                        userId: authResult.user.uid,
                        role: "assistant",
                        content: assistantMessage,
                        videoId: videoId || undefined
                      })
                    }
                    
                    // Send completion signal
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'done',
                      chatId: chatId || `chat_${Date.now()}`
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