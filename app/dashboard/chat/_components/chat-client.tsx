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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  
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
      
      try {
        const result = await getUserChatsAction(userId)
        
        if (result.isSuccess && result.data && result.data.length > 0) {
          console.log("[ChatClient] Found", result.data.length, "chats")
          // Get the most recent chat that's not video-specific
          const recentChat = result.data.find(chat => chat.type === "progress_assistant")
          
          if (recentChat && recentChat.messages && recentChat.messages.length > 0) {
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
      } catch (error) {
        console.error("[ChatClient] Error loading chat history:", error)
      }
    }
    
    if (userId) {
      loadChatHistory()
    }
  }, [userId])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [input])
  
  // Track if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Check if user is within 100px of the bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsUserScrolling(!isAtBottom)
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Scroll to bottom when messages change (only if user isn't scrolling)
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isUserScrolling])
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    console.log("[ChatClient] Sending message:", input.substring(0, 50) + "...")
    
    // Reset scroll tracking when sending a new message
    setIsUserScrolling(false)
    
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
                // Handle the streaming response format from Claude API
                if (data.type === 'text' && data.text) {
                  assistantMessage += data.text
                  
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
                } else if (data.type === 'done') {
                  console.log("[ChatClient] Stream completed with chatId:", data.chatId)
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
  
  // Function to render message content with markdown support and clickable timestamps
  const renderMessageContent = (content: string, role: "user" | "assistant") => {
    // Parse markdown with React
    const parseMarkdown = (text: string) => {
      // Handle code blocks first (to prevent other parsing inside code blocks)
      text = text.replace(/```([^`]*?)```/g, (match, code) => {
        return `<pre class="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto"><code>${code.trim()}</code></pre>`
      })
      
      // Handle inline code
      text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      
      // Handle headers (h1-h6)
      text = text.replace(/^#{6}\s+(.+)$/gm, '<h6 class="text-sm font-semibold mt-4 mb-2">$1</h6>')
      text = text.replace(/^#{5}\s+(.+)$/gm, '<h5 class="text-base font-semibold mt-4 mb-2">$1</h5>')
      text = text.replace(/^#{4}\s+(.+)$/gm, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
      text = text.replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      text = text.replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      text = text.replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
      
      // Handle bold
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
      // Handle italic
      text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Handle links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Handle bullet points
      text = text.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      // Wrap multiple li elements in ul
      text = text.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => `<ul class="list-disc list-inside my-2">${match}</ul>`)
      
      // Handle numbered lists
      text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
      
      return text
    }
    
    // For assistant messages, parse timestamps and markdown
    if (role === "assistant") {
      const timestampRegex = /\[([^\]]+)\]\(timestamp:(\d+)\)/g
      
      return content.split("\n").map((paragraph, idx) => {
        // First, handle timestamps if there's a video context
        if (video) {
          const parts: (string | React.ReactElement)[] = []
          let lastIndex = 0
          let match
          
          // Reset regex lastIndex for each paragraph
          timestampRegex.lastIndex = 0
          
          while ((match = timestampRegex.exec(paragraph)) !== null) {
            // Add text before the timestamp
            if (match.index > lastIndex) {
              parts.push(parseMarkdown(paragraph.substring(lastIndex, match.index)))
            }
            
            // Add the clickable timestamp
            const timestampText = match[1]
            const seconds = parseInt(match[2])
            
            // Create YouTube URL with timestamp
            const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}&t=${seconds}`
            
            parts.push(
              <a
                key={`timestamp-${idx}-${match.index}`}
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors duration-200 mx-1 no-underline"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timestampText}
              </a>
            )
            
            lastIndex = match.index + match[0].length
          }
          
          // Add remaining text
          if (lastIndex < paragraph.length) {
            parts.push(parseMarkdown(paragraph.substring(lastIndex)))
          }
          
          // If we have mixed content, render it differently
          if (parts.length > 0) {
            return (
              <div key={idx} className="mb-2 last:mb-0">
                {parts.map((part, partIdx) => {
                  if (typeof part === 'string') {
                    return <span key={partIdx} dangerouslySetInnerHTML={{ __html: part }} />
                  }
                  return part
                })}
              </div>
            )
          }
        }
        
        // No timestamps found or no video context, just parse markdown
        return (
          <div 
            key={idx} 
            className="mb-2 last:mb-0"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(paragraph) }}
          />
        )
      })
    }
    
    // For user messages, just split by newlines
    return content.split("\n").map((paragraph, idx) => (
      <p key={idx} className="mb-2 last:mb-0">
        {paragraph}
      </p>
    ))
  }
  
  return (
    <div className="flex-1 bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col m-4">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          {/* Show video context if available */}
          {video && messages.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-sm font-medium mb-1">Discussing video:</p>
              <p className="text-sm text-muted-foreground">{video.title}</p>
            </div>
          )}
          
          {/* Messages or welcome screen */}
          {messages.length === 0 ? (
            <>
              {/* Welcome message */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-6 max-w-2xl border border-blue-200">
                    <p className="font-semibold text-lg mb-3">Your AI Business Coach is here! 🚀</p>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      I'm powered by Claude 4 and trained on all of Greg's content. I can help you:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Find Video Insights</p>
                          <p className="text-xs text-muted-foreground">Get specific timestamps and takeaways</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Weekly Check-ins</p>
                          <p className="text-xs text-muted-foreground">Get help with your assignments</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Business Strategy</p>
                          <p className="text-xs text-muted-foreground">Get personalized advice</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">Technical Help</p>
                          <p className="text-xs text-muted-foreground">Debug and solve problems</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add video recommendations */}
                    <div className="mt-4 p-3 bg-white/80 rounded-xl">
                      <p className="text-sm font-medium mb-2">📺 Start with these videos:</p>
                      <div className="space-y-1">
                        <a href="/dashboard/videos" className="text-xs text-blue-600 hover:underline block">
                          • "How to Find Your First 100 Customers" - Essential strategies
                        </a>
                        <a href="/dashboard/videos" className="text-xs text-blue-600 hover:underline block">
                          • "Building Your MVP in 2 Weeks" - Step-by-step guide
                        </a>
                        <a href="/dashboard/videos" className="text-xs text-blue-600 hover:underline block">
                          • "AI Tools for Entrepreneurs" - Must-have toolkit
                        </a>
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
                    onClick={() => handleExampleQuestion("What's the best way to validate my business idea?")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    What's the best way to validate my business idea?
                  </button>
                  <button 
                    onClick={() => handleExampleQuestion("How do I find my first customers?")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    How do I find my first customers?
                  </button>
                  <button 
                    onClick={() => handleExampleQuestion("Show me successful AI startup examples")}
                    className="px-4 py-2 bg-white border border-border/40 rounded-full text-sm hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200"
                  >
                    Show me successful AI startup examples
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
                    : "bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
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
                      : "bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200"
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
                <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-6 max-w-2xl border border-blue-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
                placeholder="Ask about business strategies, video insights, or get help with your startup..."
                className="w-full min-h-[60px] max-h-[120px] px-6 py-4 bg-white border border-border/40 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 ${
                (!input.trim() || isLoading) ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!input.trim() || isLoading}
            >
              <span>{isLoading ? "Thinking..." : "Send"}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {video ? `Discussing: ${video.title}` : "Press Enter to send, Shift+Enter for new line"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Powered by Claude 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 