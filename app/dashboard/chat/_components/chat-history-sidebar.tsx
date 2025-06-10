"use client"

import { useState, useEffect } from "react"
import { FirebaseChat } from "@/types/firebase-types"
import { getUserChatsAction, deleteChatAction, updateChatTitleAction } from "@/actions/db/chat-actions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar,
  Video,
  BookOpen,
  X,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface ChatHistorySidebarProps {
  userId: string
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  className?: string
}

export default function ChatHistorySidebar({
  userId,
  currentChatId,
  onSelectChat,
  onNewChat,
  className
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<FirebaseChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  console.log("[Chat History Sidebar] Component rendered")

  // Load chat history
  const loadChats = async () => {
    console.log("[Chat History Sidebar] Loading chats for user:", userId)
    setIsLoading(true)
    
    try {
      const result = await getUserChatsAction(userId)
      if (result.isSuccess && result.data) {
        console.log("[Chat History Sidebar] Loaded chats:", result.data.length)
        setChats(result.data)
      }
    } catch (error) {
      console.error("[Chat History Sidebar] Error loading chats:", error)
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load chats on mount and when userId changes
  useEffect(() => {
    loadChats()
  }, [userId])

  // Group chats by date
  const groupChatsByDate = () => {
    const groups: Record<string, FirebaseChat[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    }

    chats.forEach(chat => {
      const lastMessageDate = chat.metadata?.lastMessageAt
      if (!lastMessageDate) {
        groups.older.push(chat)
        return
      }

      // Convert Timestamp to Date if needed
      const date = lastMessageDate instanceof Date 
        ? lastMessageDate 
        : new Date(lastMessageDate.seconds * 1000)
      if (isToday(date)) {
        groups.today.push(chat)
      } else if (isYesterday(date)) {
        groups.yesterday.push(chat)
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(chat)
      } else if (isThisMonth(date)) {
        groups.thisMonth.push(chat)
      } else {
        groups.older.push(chat)
      }
    })

    return groups
  }

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm("Are you sure you want to delete this chat?")) {
      console.log("[Chat History Sidebar] Deleting chat:", chatId)
      
      try {
        const result = await deleteChatAction(chatId, userId)
        if (result.isSuccess) {
          setChats(prev => prev.filter(chat => chat.chatId !== chatId))
          if (currentChatId === chatId) {
            onNewChat()
          }
          toast({
            title: "Success",
            description: "Chat deleted successfully"
          })
        }
      } catch (error) {
        console.error("[Chat History Sidebar] Error deleting chat:", error)
        toast({
          title: "Error",
          description: "Failed to delete chat",
          variant: "destructive"
        })
      }
    }
  }

  // Handle title editing
  const handleEditTitle = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditingTitle(currentTitle || "")
  }

  // Save edited title
  const handleSaveTitle = async (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null)
      return
    }

    console.log("[Chat History Sidebar] Updating chat title:", chatId)
    
    try {
      const result = await updateChatTitleAction(chatId, userId, editingTitle.trim())
      if (result.isSuccess) {
        setChats(prev => prev.map(chat => 
          chat.chatId === chatId 
            ? { ...chat, metadata: { ...chat.metadata, title: editingTitle.trim() } } 
            : chat
        ))
        toast({
          title: "Success",
          description: "Chat title updated"
        })
      }
    } catch (error) {
      console.error("[Chat History Sidebar] Error updating title:", error)
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive"
      })
    } finally {
      setEditingChatId(null)
    }
  }

  // Get chat title or generate from first message
  const getChatTitle = (chat: FirebaseChat) => {
    if (chat.metadata?.title) return chat.metadata.title
    
    // Generate title from first user message
    const firstUserMessage = chat.messages?.find(msg => msg.role === "user")
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
    }
    
    // Fallback based on chat type
    if (chat.type === "video_learning") {
      return "Video Discussion"
    } else if (chat.type === "assignment_help") {
      return "Assignment Help"
    } else {
      return "New Chat"
    }
  }

  // Get chat icon based on type
  const getChatIcon = (chat: FirebaseChat) => {
    switch (chat.type) {
      case "video_learning":
        return <Video className="w-4 h-4" />
      case "assignment_help":
        return <BookOpen className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const chatGroups = groupChatsByDate()

  return (
    <div className={cn(
      "flex flex-col h-full bg-white/50 backdrop-blur-sm border-r border-border/40",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <>
              {/* Today */}
              {chatGroups.today.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Today
                  </h3>
                  <div className="space-y-1">
                    {chatGroups.today.map(chat => (
                      <ChatItem
                        key={chat.chatId}
                        chat={chat}
                        isActive={currentChatId === chat.chatId}
                        isEditing={editingChatId === chat.chatId}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSelect={() => onSelectChat(chat.chatId)}
                        onDelete={(e) => handleDeleteChat(chat.chatId, e)}
                        onEdit={(e) => handleEditTitle(chat.chatId, getChatTitle(chat), e)}
                        onSaveTitle={() => handleSaveTitle(chat.chatId)}
                        onCancelEdit={() => setEditingChatId(null)}
                        title={getChatTitle(chat)}
                        icon={getChatIcon(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday */}
              {chatGroups.yesterday.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Yesterday
                  </h3>
                  <div className="space-y-1">
                    {chatGroups.yesterday.map(chat => (
                      <ChatItem
                        key={chat.chatId}
                        chat={chat}
                        isActive={currentChatId === chat.chatId}
                        isEditing={editingChatId === chat.chatId}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSelect={() => onSelectChat(chat.chatId)}
                        onDelete={(e) => handleDeleteChat(chat.chatId, e)}
                        onEdit={(e) => handleEditTitle(chat.chatId, getChatTitle(chat), e)}
                        onSaveTitle={() => handleSaveTitle(chat.chatId)}
                        onCancelEdit={() => setEditingChatId(null)}
                        title={getChatTitle(chat)}
                        icon={getChatIcon(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* This Week */}
              {chatGroups.thisWeek.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    This Week
                  </h3>
                  <div className="space-y-1">
                    {chatGroups.thisWeek.map(chat => (
                      <ChatItem
                        key={chat.chatId}
                        chat={chat}
                        isActive={currentChatId === chat.chatId}
                        isEditing={editingChatId === chat.chatId}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSelect={() => onSelectChat(chat.chatId)}
                        onDelete={(e) => handleDeleteChat(chat.chatId, e)}
                        onEdit={(e) => handleEditTitle(chat.chatId, getChatTitle(chat), e)}
                        onSaveTitle={() => handleSaveTitle(chat.chatId)}
                        onCancelEdit={() => setEditingChatId(null)}
                        title={getChatTitle(chat)}
                        icon={getChatIcon(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* This Month */}
              {chatGroups.thisMonth.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    This Month
                  </h3>
                  <div className="space-y-1">
                    {chatGroups.thisMonth.map(chat => (
                      <ChatItem
                        key={chat.chatId}
                        chat={chat}
                        isActive={currentChatId === chat.chatId}
                        isEditing={editingChatId === chat.chatId}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSelect={() => onSelectChat(chat.chatId)}
                        onDelete={(e) => handleDeleteChat(chat.chatId, e)}
                        onEdit={(e) => handleEditTitle(chat.chatId, getChatTitle(chat), e)}
                        onSaveTitle={() => handleSaveTitle(chat.chatId)}
                        onCancelEdit={() => setEditingChatId(null)}
                        title={getChatTitle(chat)}
                        icon={getChatIcon(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Older */}
              {chatGroups.older.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Older
                  </h3>
                  <div className="space-y-1">
                    {chatGroups.older.map(chat => (
                      <ChatItem
                        key={chat.chatId}
                        chat={chat}
                        isActive={currentChatId === chat.chatId}
                        isEditing={editingChatId === chat.chatId}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onSelect={() => onSelectChat(chat.chatId)}
                        onDelete={(e) => handleDeleteChat(chat.chatId, e)}
                        onEdit={(e) => handleEditTitle(chat.chatId, getChatTitle(chat), e)}
                        onSaveTitle={() => handleSaveTitle(chat.chatId)}
                        onCancelEdit={() => setEditingChatId(null)}
                        title={getChatTitle(chat)}
                        icon={getChatIcon(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Individual chat item component
interface ChatItemProps {
  chat: FirebaseChat
  isActive: boolean
  isEditing: boolean
  editingTitle: string
  onEditingTitleChange: (title: string) => void
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onSaveTitle: () => void
  onCancelEdit: () => void
  title: string
  icon: React.ReactNode
}

function ChatItem({
  chat,
  isActive,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onSelect,
  onDelete,
  onEdit,
  onSaveTitle,
  onCancelEdit,
  title,
  icon
}: ChatItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-purple-100 text-purple-900 shadow-sm" 
          : "hover:bg-purple-50 text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="flex-shrink-0 text-purple-600">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onSaveTitle()
              } else if (e.key === "Escape") {
                onCancelEdit()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-sm bg-white border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium truncate">{title}</p>
        )}
        
        {chat.metadata?.totalMessages && (
          <p className="text-xs text-muted-foreground">
            {chat.metadata.totalMessages} messages
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onSaveTitle()
              }}
              className="h-7 w-7 p-0"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onCancelEdit()
              }}
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-7 w-7 p-0 hover:bg-purple-200"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 