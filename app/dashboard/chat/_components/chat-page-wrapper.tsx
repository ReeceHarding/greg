"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ChatClient from "./chat-client"
import ChatHistorySidebar from "./chat-history-sidebar"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatPageWrapperProps {
  userId: string
}

export default function ChatPageWrapper({ userId }: ChatPageWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [key, setKey] = useState(0) // Force remount of ChatClient when chat changes
  
  console.log("[Chat Page Wrapper] Component rendered")

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    console.log("[Chat Page Wrapper] Selecting chat:", chatId)
    setCurrentChatId(chatId)
    // Force remount of ChatClient to load the selected chat
    setKey(prev => prev + 1)
    
    // Update URL without videoId if switching to a different chat
    if (videoId) {
      router.push("/dashboard/chat")
    }
  }

  // Handle new chat creation
  const handleNewChat = () => {
    console.log("[Chat Page Wrapper] Creating new chat")
    setCurrentChatId(null)
    // Force remount of ChatClient
    setKey(prev => prev + 1)
    
    // Clear URL parameters
    router.push("/dashboard/chat")
  }

  return (
    <div className="flex h-full">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 z-50 lg:hidden"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Chat History Sidebar */}
      <div
        className={cn(
          "absolute lg:relative z-40 h-full transition-all duration-300",
          "w-80 lg:w-80",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <ChatHistorySidebar
          userId={userId}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          className="h-full"
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Chat Client */}
      <div className="flex-1 relative">
        <ChatClient key={key} userId={userId} chatId={currentChatId} />
      </div>
    </div>
  )
} 