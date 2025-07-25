"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createChatMessageAction, getUserChatsAction, updateChatTitleAction } from "@/actions/db/chat-actions"
import { getVideoByIdAction } from "@/actions/videos/video-actions"
import { getSubmissionsByStudentAction } from "@/actions/db/submissions-actions"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { generateChatTitleAction } from "@/actions/ai/title-generation-actions"
import { SerializedFirebaseVideo, FirebaseSubmission, FirebaseAssignment } from "@/types/firebase-types"
import { toast } from "@/hooks/use-toast"
import { Send, Bot, User, AtSign, FileText, Video, ChevronRight, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatClientProps {
  userId: string
  chatId?: string | null
}

export default function ChatClient({ userId, chatId: propChatId }: ChatClientProps) {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [video, setVideo] = useState<SerializedFirebaseVideo | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showSubmissionPicker, setShowSubmissionPicker] = useState(false)
  const [submissions, setSubmissions] = useState<FirebaseSubmission[]>([])
  const [assignments, setAssignments] = useState<Map<string, FirebaseAssignment>>(new Map())
  const [selectedSubmission, setSelectedSubmission] = useState<FirebaseSubmission | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageRef = useRef<string>("")
  const isUserScrolling = useRef(false)
  const lastScrollTop = useRef(0)
  
  console.log("[Chat Client] Component rendered with videoId:", videoId)

  // Track user scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      
      // Detect if user is scrolling up
      if (scrollTop < lastScrollTop.current && !isAtBottom) {
        isUserScrolling.current = true
      } else if (isAtBottom) {
        isUserScrolling.current = false
      }
      
      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to bottom when new messages arrive (only if user isn't scrolling)
  const scrollToBottom = () => {
    if (!isUserScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load video details if videoId is present
  useEffect(() => {
    const loadVideo = async () => {
      if (videoId) {
        console.log("[Chat Client] Loading video details for:", videoId)
        const result = await getVideoByIdAction(videoId)
        if (result.isSuccess && result.data) {
          setVideo(result.data)
          console.log("[Chat Client] Video loaded:", result.data.title)
        }
      }
    }
    loadVideo()
  }, [videoId])

  // Initialize chat on component mount
  useEffect(() => {
    const initializeChat = async () => {
      console.log("[Chat Client] Initializing chat...")
      setIsInitializing(true)
      setMessages([]) // Clear messages when switching chats
      
      try {
        let newChatId: string
        
        if (propChatId) {
          // Use the provided chat ID (from history)
          newChatId = propChatId
        } else {
          // Generate new chat ID for new conversations
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const dateKey = today.toISOString().split('T')[0]
          
          // Generate consistent chatId based on date and video context
          newChatId = videoId 
            ? `${userId}-video-${videoId}-${dateKey}`
            : `${userId}-general-${dateKey}`
        }
        
        console.log("[Chat Client] Using chat ID:", newChatId)
        setChatId(newChatId)
        
        // Load existing messages from this chat session
        const historyResult = await getUserChatsAction(userId)
        if (historyResult.isSuccess && historyResult.data) {
          const todayChat = historyResult.data.find(chat => chat.chatId === newChatId)
          
          if (todayChat && todayChat.messages && todayChat.messages.length > 0) {
            console.log("[Chat Client] Found existing chat with messages:", todayChat.messages.length)
            const existingMessages: Message[] = todayChat.messages.map(msg => ({
              id: msg.messageId,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : 
                        (msg.timestamp && typeof (msg.timestamp as any).toDate === 'function' ? 
                         (msg.timestamp as any).toDate() : new Date())
            }))
            
            // Sort by timestamp
            existingMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            setMessages(existingMessages)
          }
        }
        
        // Load user's submissions
        const submissionsResult = await getSubmissionsByStudentAction(userId)
        if (submissionsResult.isSuccess && submissionsResult.data) {
          setSubmissions(submissionsResult.data)
          console.log("[Chat Client] Loaded submissions:", submissionsResult.data.length)
        }
        
        // Load assignments for mapping
        const assignmentsResult = await getAllAssignmentsAction()
        if (assignmentsResult.isSuccess && assignmentsResult.data) {
          const assignmentMap = new Map(
            assignmentsResult.data.map(a => [a.assignmentId, a])
          )
          setAssignments(assignmentMap)
        }
      } catch (error) {
        console.error("[Chat Client] Error initializing chat:", error)
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please refresh the page.",
          variant: "destructive"
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [userId, videoId, propChatId])

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Check if user typed @ at the end
    if (value.endsWith('@') && submissions.length > 0) {
      setShowSubmissionPicker(true)
    } else if (showSubmissionPicker && !value.includes('@')) {
      setShowSubmissionPicker(false)
    }
  }

  // Select a submission from the picker
  const selectSubmission = (submission: FirebaseSubmission) => {
    const assignment = assignments.get(submission.assignmentId)
    const submissionRef = `@[Week ${assignment?.weekNumber || '?'}: ${assignment?.title || 'Unknown Assignment'}]`
    
    // Replace the @ with the submission reference
    const newInput = input.slice(0, -1) + submissionRef + ' '
    setInput(newInput)
    setSelectedSubmission(submission)
    setShowSubmissionPicker(false)
    textareaRef.current?.focus()
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !chatId) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    isUserScrolling.current = false // Reset scroll lock when user sends message

    // Check if this is the first message in the chat (for title generation)
    const isFirstMessage = messages.length === 0

    // Add user message to UI
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, tempUserMessage])

    // Store the user message
    const messageResult = await createChatMessageAction({
      userId,
      chatId,
      role: "user",
      content: userMessage,
      videoId: videoId || undefined
    })

    if (!messageResult.isSuccess) {
      console.error("[Chat Client] Failed to save message")
    }

    // Generate title for new chats after the first message
    if (isFirstMessage && chatId) {
      console.log("[Chat Client] Generating title for new chat")
      const titleResult = await generateChatTitleAction(userMessage)
      if (titleResult.isSuccess && titleResult.data) {
        console.log("[Chat Client] Generated title:", titleResult.data)
        // Update the chat title
        await updateChatTitleAction(chatId, userId, titleResult.data)
      }
    }

    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, tempAssistantMessage])

    try {
      console.log("[Chat Client] Sending message to API with video context:", !!video)
      
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          userId,
          chatId,
          videoId: video?.videoId,
          videoTitle: video?.title,
          selectedSubmission: selectedSubmission ? {
            submissionId: selectedSubmission.submissionId,
            assignmentId: selectedSubmission.assignmentId,
            assignmentTitle: assignments.get(selectedSubmission.assignmentId)?.title,
            weekNumber: assignments.get(selectedSubmission.assignmentId)?.weekNumber,
            status: selectedSubmission.status,
            content: selectedSubmission.content,
            aiFeedback: selectedSubmission.aiFeedback,
            instructorFeedback: selectedSubmission.instructorFeedback
          } : undefined
        })
      })

      console.log("[Chat Client] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

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
                if (data.text) {
                  fullResponse += data.text
                  
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.role === "assistant") {
                      lastMessage.content = fullResponse
                    }
                    return newMessages
                  })
                }
                
                // Handle video recommendations
                if (data.videoRecommendations) {
                  console.log("[Chat Client] Received video recommendations:", data.videoRecommendations)
                  // Video recommendations are already embedded in the response
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Store the assistant response
      if (fullResponse) {
        await createChatMessageAction({
          userId,
          chatId,
          role: "assistant",
          content: fullResponse,
          videoId: videoId || undefined
        })
      }

      // Clear selected submission after sending
      setSelectedSubmission(null)
      
    } catch (error) {
      console.error("[Chat Client] Error:", error)
      toast({
        title: "Error",
        description: "Failed to get response from Greg AI. Please try again.",
        variant: "destructive"
      })
      
      // Remove the temporary assistant message on error
      setMessages(prev => prev.filter(m => m.id !== tempAssistantMessage.id))
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
  
  // Show initialization state
  if (isInitializing) {
    return (
      <div className="flex h-full bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-muted-foreground">Initializing Greg AI...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Parse markdown with support for video recommendations and timestamps
  const parseMarkdown = (text: string) => {
    const elements: React.ReactElement[] = []
    let lastIndex = 0
    
    // First, handle timestamps [0:05], [10:03], [49:36] or with (timestamp:seconds)
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\](?:\(timestamp:(\d+)\))?/g
    let timestampMatch
    const timestamps: Array<{index: number, length: number, element: React.ReactElement}> = []
    
    while ((timestampMatch = timestampRegex.exec(text)) !== null) {
      const [fullMatch, displayTime, seconds] = timestampMatch
      
      // Extract seconds from display time if not provided
      let totalSeconds = seconds ? parseInt(seconds) : 0
      if (!seconds && displayTime) {
        const parts = displayTime.split(':').map(p => parseInt(p))
        if (parts.length === 2) {
          totalSeconds = parts[0] * 60 + parts[1]
        } else if (parts.length === 3) {
          totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
        }
      }
      
      // Try to find the video ID from the nearest video context
      let videoId = video?.videoId
      
      // Check if there's a video reference in the nearby text
      const videoRefRegex = /(?:from\s+"([^"]+)"|video:\s*([a-zA-Z0-9_-]{11}))/gi
      const nearbyText = text.substring(Math.max(0, timestampMatch.index - 100), timestampMatch.index + 100)
      const videoRefMatch = videoRefRegex.exec(nearbyText)
      
      if (videoRefMatch) {
        // If we found a video ID pattern
        const potentialVideoId = videoRefMatch[2]
        if (potentialVideoId && /^[a-zA-Z0-9_-]{11}$/.test(potentialVideoId)) {
          videoId = potentialVideoId
        }
      }
      
      const youtubeUrl = videoId 
        ? `https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds}` 
        : '#'
      
      timestamps.push({
        index: timestampMatch.index,
        length: fullMatch.length,
        element: (
          <a
            key={`timestamp-${timestampMatch.index}`}
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={(e) => {
              if (videoId) {
                console.log(`[Chat Client] Opening YouTube at timestamp: ${displayTime} (${totalSeconds}s)`)
              } else {
                e.preventDefault()
                toast({
                  title: "No video context",
                  description: "Unable to determine which video this timestamp refers to",
                  variant: "destructive"
                })
              }
            }}
          >
            <Video className="w-3 h-3" />
            {displayTime}
          </a>
        )
      })
    }
    
    // Then handle video recommendations [VIDEO: title](videoId)
    const videoRegex = /\[VIDEO: ([^\]]+)\]\(([^)]+)\)/g
    let match
    
    while ((match = videoRegex.exec(text)) !== null) {
      // Add text before the video
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index)
        elements.push(
          <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ 
            __html: parseBasicMarkdown(textBefore) 
          }} />
        )
      }
      
      // Extract video info
      const [fullMatch, title, videoId] = match
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      
      // Add video recommendation card
      elements.push(
        <a
          key={`video-${match.index}`}
          href={`/dashboard/videos/${videoId}`}
          className="block my-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0 w-32 h-20 rounded overflow-hidden">
              <img 
                src={thumbnailUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-purple-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                {title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
                <span>Watch video</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </a>
      )
      
      lastIndex = match.index + fullMatch.length
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      let remainingText = text.substring(lastIndex)
      
      // Check if any timestamps are in this remaining portion
      const relevantTimestamps = timestamps.filter(ts => ts.index >= lastIndex)
      
      if (relevantTimestamps.length > 0) {
        let textParts: React.ReactElement[] = []
        let currentIndex = 0
        
        relevantTimestamps.forEach((ts, idx) => {
          const relativeIndex = ts.index - lastIndex
          if (relativeIndex > currentIndex) {
            textParts.push(
              <span key={`text-part-${idx}`} dangerouslySetInnerHTML={{ 
                __html: parseBasicMarkdown(remainingText.substring(currentIndex, relativeIndex)) 
              }} />
            )
          }
          textParts.push(ts.element)
          currentIndex = relativeIndex + ts.length
        })
        
        if (currentIndex < remainingText.length) {
          textParts.push(
            <span key={`text-part-final`} dangerouslySetInnerHTML={{ 
              __html: parseBasicMarkdown(remainingText.substring(currentIndex)) 
            }} />
          )
        }
        
        elements.push(...textParts)
      } else {
        elements.push(
          <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ 
            __html: parseBasicMarkdown(remainingText) 
          }} />
        )
      }
    }
    
    // If no special elements were found, parse the text with timestamps
    if (elements.length === 0) {
      // Process timestamps in the entire text
      let processedElements: React.ReactElement[] = []
      let currentPos = 0
      
      // Sort timestamps by position
      timestamps.sort((a, b) => a.index - b.index)
      
      timestamps.forEach(ts => {
        if (ts.index > currentPos) {
          processedElements.push(
            <span key={`text-before-${ts.index}`} dangerouslySetInnerHTML={{ 
              __html: parseBasicMarkdown(text.substring(currentPos, ts.index)) 
            }} />
          )
        }
        processedElements.push(ts.element)
        currentPos = ts.index + ts.length
      })
      
      if (currentPos < text.length) {
        processedElements.push(
          <span key={`text-after-${currentPos}`} dangerouslySetInnerHTML={{ 
            __html: parseBasicMarkdown(text.substring(currentPos)) 
          }} />
        )
      }
      
      return processedElements.length > 0 ? processedElements : <span dangerouslySetInnerHTML={{ __html: parseBasicMarkdown(text) }} />
    }
    
    return elements
  }
  
  // Basic markdown parsing for other elements
  const parseBasicMarkdown = (text: string) => {
    // Handle headers (h1-h6)
    text = text.replace(/^###### (.+)$/gm, '<h6 class="text-sm font-semibold mt-3 mb-1">$1</h6>')
    text = text.replace(/^##### (.+)$/gm, '<h5 class="text-base font-semibold mt-3 mb-1">$1</h5>')
    text = text.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
    text = text.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
    text = text.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>')
    text = text.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
    
    // Handle code blocks
    text = text.replace(/```([^`]*?)```/g, (match, code) => {
      return `<pre class="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto"><code>${code.trim()}</code></pre>`
    })
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    
    // Handle bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Handle italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Handle bullet points
    text = text.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    text = text.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-2">$&</ul>')
    
    // Handle numbered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    text = text.replace(/(<li.*<\/li>\n?)+/g, function(match) {
      if (match.includes('list-disc')) return match
      return '<ol class="list-decimal space-y-1 my-2">' + match + '</ol>'
    })
    
    // Handle line breaks
    text = text.replace(/\n\n/g, '</p><p class="mt-2">')
    text = '<p>' + text + '</p>'
    
    return text
  }

  return (
    <div className="flex h-full bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Welcome to AI Chat</h3>
              <p className="text-muted-foreground">
                I'm your personal AI coach, here to help you succeed in your entrepreneurship journey. 
                Ask me anything about the course content, get feedback on your submissions, or discuss your startup ideas!
              </p>
            </div>
            
            {/* Example questions */}
            <div className="w-full space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
              <div className="grid gap-2">
                {(video ? [
                  "Can you summarize the key points from this video?",
                  "What are the action items from this lesson?",
                  "How can I apply these concepts to my startup?"
                ] : [
                  "What should I focus on this week?",
                  "How do I validate my startup idea?",
                  "Can you review my business model?"
                ]).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleQuestion(question)}
                    className="text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-sm text-purple-900 transition-colors duration-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "assistant" ? "justify-start" : "justify-end"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900 border border-blue-200/50"
                      : "bg-purple-600 text-white"
                  )}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.role === "assistant" ? (
                      <div className="text-sm [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:mb-3 [&>h2]:mb-3 [&>h3]:mb-2 [&>h4]:mb-2">
                        {parseMarkdown(message.content)}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    message.role === "assistant" ? "text-gray-600" : "text-purple-200"
                  )}>
                    {format(message.timestamp, "h:mm a")}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200/50 rounded-2xl px-4 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Submission Picker */}
      {showSubmissionPicker && submissions.length > 0 && (
        <div className="absolute bottom-20 left-8 right-8 bg-white rounded-lg shadow-lg border border-border/40 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AtSign className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Select a submission to discuss</span>
              </div>
              <button
                onClick={() => setShowSubmissionPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {submissions.map((submission) => {
              const assignment = assignments.get(submission.assignmentId)
              return (
                <button
                  key={submission.submissionId}
                  onClick={() => selectSubmission(submission)}
                  className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors duration-200 mb-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        Week {assignment?.weekNumber || '?'}: {assignment?.title || 'Unknown Assignment'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          submission.status === "approved" ? "bg-green-100 text-green-700" :
                          submission.status === "submitted" ? "bg-blue-100 text-blue-700" :
                          submission.status === "needs_revision" ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {submission.status.replace(/_/g, ' ')}
                        </span>
                        {submission.aiFeedback && (
                          <span className="text-xs text-muted-foreground">
                            Score: {submission.aiFeedback.overallScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border/40 p-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={video ? `Ask about "${video.title}"...` : "Ask Greg AI anything..."}
            className="flex-1 resize-none rounded-xl border border-border/40 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all duration-200 min-h-[48px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 text-white rounded-xl px-4 py-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <AtSign className="w-3 h-3" />
          <span>Type @ to reference your submissions for feedback</span>
        </div>
      </div>
    </div>
  )
} 