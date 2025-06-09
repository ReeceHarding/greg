"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createChatMessageAction, getUserChatsAction } from "@/actions/db/chat-actions"
import { getVideoByIdAction } from "@/actions/videos/video-actions"
import { SerializedFirebaseVideo } from "@/types/firebase-types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatClientProps {
  userId: string
}

export default function ChatClient({ userId }: ChatClientProps) {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [video, setVideo] = useState<SerializedFirebaseVideo | null>(null)
  const [chatId, setChatId] = useState<string>(`chat_${userId}_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  console.log("[ChatClient] Rendering with userId:", userId, "videoId:", videoId)
  
  // Load video context if videoId is provided
  useEffect(() => {
    async function loadVideo() {
      if (!videoId) return
      
      console.log("[ChatClient] Loading video context for:", videoId)
      const result = await getVideoByIdAction(videoId)
      
      if (result.isSuccess && result.data) {
        console.log("[ChatClient] Loaded video:", result.data.title)
        setVideo(result.data)
      }
    }
    
    loadVideo()
  }, [videoId])
  
  // Load chat history
  useEffect(() => {
    async function loadChatHistory() {
      console.log("[ChatClient] Loading chat history for user:", userId)
      const result = await getUserChatsAction(userId)
      
      if (result.isSuccess && result.data.length > 0) {
        console.log("[ChatClient] Found", result.data.length, "chats")
        // Get the most recent chat that's not video-specific
        const recentChat = result.data.find(chat => chat.type === "progress_assistant")
        
        if (recentChat && recentChat.messages.length > 0) {
          console.log("[ChatClient] Loading recent chat with", recentChat.messages.length, "messages")
          setChatId(recentChat.chatId)
          
          // Convert chat messages to UI format
          const loadedMessages: Message[] = recentChat.messages.map((msg, index) => ({
            id: `msg-${index}`,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date()
          }))
          
          setMessages(loadedMessages)
        }
      }
    }
    
    loadChatHistory()
  }, [userId])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [input])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    console.log("[ChatClient] Sending message:", input.substring(0, 50) + "...")
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    
    try {
      // Save user message to database
      await createChatMessageAction({
        chatId,
        userId,
        role: "user",
        content: currentInput,
        videoId: video?.videoId
      })
      
      // Create request body with video context if available
      const requestBody = {
        message: currentInput,
        chatHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        ...(video && {
          videoContext: {
            id: video.videoId,
            title: video.title,
            transcript: video.transcript
          }
        })
      }
      
      console.log("[ChatClient] Calling Claude API with video context:", !!video)
      
      // Call Claude API
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      console.log("[ChatClient] Received response, processing stream...")
      
      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""
      let assistantMessageId = `msg-${Date.now()}-assistant`
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  assistantMessage += data.content
                  
                  // Update the assistant message in real-time
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    
                    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id === assistantMessageId) {
                      lastMessage.content = assistantMessage
                    } else {
                      newMessages.push({
                        id: assistantMessageId,
                        role: "assistant",
                        content: assistantMessage,
                        timestamp: new Date()
                      })
                    }
                    
                    return newMessages
                  })
                }
              } catch (e) {
                console.error("[ChatClient] Error parsing SSE data:", e)
              }
            }
          }
        }
      }
      
      console.log("[ChatClient] Stream complete, saving assistant message to database")
      
      // Save assistant message to database
      await createChatMessageAction({
        chatId,
        userId,
        role: "assistant",
        content: assistantMessage,
        videoId: video?.videoId
      })
      
      console.log("[ChatClient] Chat saved successfully")
      
    } catch (error) {
      console.error("[ChatClient] Error sending message:", error)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleExampleQuestion = (question: string) => {
    setInput(question)
    textareaRef.current?.focus()
  }
  
  // Function to render message content with clickable timestamps
  const renderMessageContent = (content: string, role: "user" | "assistant") => {
    if (role === "user" || !video) {
      // For user messages or when no video context, just split by newlines
      return content.split("\n").map((paragraph, idx) => (
        <p key={idx} className="mb-2 last:mb-0">
          {paragraph}
        </p>
      ))
    }
    
    // For assistant messages with video context, parse timestamps
    const timestampRegex = /\[([^\]]+)\]\(timestamp:(\d+)\)/g
    
    return content.split("\n").map((paragraph, idx) => {
      const parts = []
      let lastIndex = 0
      let match
      
      while ((match = timestampRegex.exec(paragraph)) !== null) {
        // Add text before the timestamp
        if (match.index > lastIndex) {
          parts.push(paragraph.substring(lastIndex, match.index))
        }
        
        // Add the clickable timestamp
        const timestampText = match[1]
        const seconds = parseInt(match[2])
        
        parts.push(
          <button
            key={`timestamp-${idx}-${match.index}`}
            onClick={() => {
              // Navigate to video page with timestamp
              window.location.href = `/dashboard/videos/${video.videoId}?t=${seconds}`
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timestampText}
          </button>
        )
        
        lastIndex = match.index + match[0].length
      }
      
      // Add remaining text
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.substring(lastIndex))
      }
      
      return (
        <p key={idx} className="mb-2 last:mb-0">
          {parts.length > 0 ? parts : paragraph}
        </p>
      )
    })
  }
  
  return (
    <div className="flex-1 bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          {/* Show video context if available */}
          {video && messages.length === 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
              <p className="text-sm font-medium mb-1">Discussing video:</p>
              <p className="text-sm text-muted-foreground">{video.title}</p>
            </div>
          )}
          
          {/* Messages or welcome screen */}
          {messages.length === 0 ? (
            <>
              {/* Welcome message */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-6 max-w-2xl border border-primary/20">
                    <p className="font-semibold text-lg mb-3">Welcome to Your AI Assistant! 👋</p>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      I'm here to help you succeed in the AI Summer Camp. I'm powered by Claude and can assist you with:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Video Content</p>
                          <p className="text-xs text-muted-foreground">Find specific timestamps and key insights</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Assignments</p>
                          <p className="text-xs text-muted-foreground">Get clarity on requirements and feedback</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Business Strategy</p>
                          <p className="text-xs text-muted-foreground">Get personalized advice for your startup</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Technical Help</p>
                          <p className="text-xs text-muted-foreground">Debug code and solve technical challenges</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Questions */}
              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground mb-4">Try asking:</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handleExampleQuestion("What's the best way to find my first 100 customers?")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    What's the best way to find my first 100 customers?
                  </button>
                  <button 
                    onClick={() => handleExampleQuestion("How do I price my AI product?")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    How do I price my AI product?
                  </button>
                  <button 
                    onClick={() => handleExampleQuestion("Show me examples of successful MVPs")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    Show me examples of successful MVPs
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Display messages */
            messages.map((message) => (
              <div key={message.id} className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" 
                    ? "bg-gradient-to-br from-gray-600 to-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    : "bg-gradient-to-br from-primary to-primary/80 shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                }`}>
                  {message.role === "user" ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className={`rounded-3xl p-6 max-w-2xl ${
                    message.role === "user"
                      ? "bg-gray-100"
                      : "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                  }`}>
                    <div className="prose prose-sm max-w-none">
                      {renderMessageContent(message.content, message.role)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-3">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
                <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-6 max-w-2xl border border-primary/20">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/40 p-6 bg-gradient-to-t from-muted/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about videos, assignments, or building your AI business..."
                className="w-full min-h-[60px] max-h-[120px] px-6 py-4 pr-16 bg-white border border-border/40 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                rows={1}
                disabled={isLoading}
              />
              <button
                className="absolute right-3 bottom-3 p-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                title="Attach file"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            <button
              onClick={sendMessage}
              className={`px-8 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-2xl font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 ${
                (!input.trim() || isLoading) ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!input.trim() || isLoading}
            >
              <span>{isLoading ? "Thinking..." : "Send Message"}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {video ? `Discussing: ${video.title}` : "Ask questions about any video, assignment, or business strategy"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Powered by Claude 4 Sonnet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 