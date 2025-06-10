"use server"

import { db, collections } from "@/db/db"
import { ActionState } from "@/types"
import { FirebaseChat, ChatMessage } from "@/types/firebase-types"
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// Helper function to serialize timestamps
function serializeTimestamp(timestamp: any): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  if (timestamp && timestamp._seconds) {
    return new Date(timestamp._seconds * 1000)
  }
  return new Date()
}

// Helper function to serialize chat for client components
function serializeChat(chat: any): FirebaseChat {
  return {
    ...chat,
    createdAt: serializeTimestamp(chat.createdAt),
    metadata: {
      ...chat.metadata,
      lastMessageAt: serializeTimestamp(chat.metadata?.lastMessageAt)
    },
    messages: chat.messages?.map((msg: any) => ({
      ...msg,
      timestamp: serializeTimestamp(msg.timestamp)
    })) || []
  }
}

// Create a new chat message
export async function createChatMessageAction(
  data: {
    chatId: string
    userId: string
    role: "user" | "assistant"
    content: string
    videoId?: string
  }
): Promise<ActionState<ChatMessage>> {
  // Validate input
  if (!data || !data.chatId || !data.userId || !data.content) {
    return { isSuccess: false, message: "Missing required fields" }
  }
  
  console.log(`[Chat Actions] Creating message for chat: ${data.chatId}`)
  
  if (!db) {
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    // First ensure the chat exists
    const chatRef = db.collection(collections.chats).doc(data.chatId)
    const chatDoc = await chatRef.get()
    
    if (!chatDoc.exists) {
      // Create the chat if it doesn't exist
      console.log(`[Chat Actions] Creating new chat: ${data.chatId}`)
      const newChat: FirebaseChat = {
        chatId: data.chatId,
        userId: data.userId,
        type: data.videoId ? "video_learning" : "progress_assistant",
        messages: [],
        metadata: {
          totalMessages: 0,
          lastMessageAt: FieldValue.serverTimestamp() as unknown as Timestamp
        },
        createdAt: FieldValue.serverTimestamp() as unknown as Timestamp
      }
      await chatRef.set(newChat)
    }
    
    // Create the message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const messageData: any = {
      messageId,
      role: data.role,
      content: data.content,
      timestamp: Timestamp.fromDate(now)
    }
    
    // Only add videoReferences if videoId is provided
    if (data.videoId) {
      messageData.videoReferences = [{
        videoId: data.videoId,
        startTime: 0,
        endTime: 0,
        relevanceScore: 1.0
      }]
    }
    
    // Update chat with new message
    await chatRef.update({
      messages: FieldValue.arrayUnion(messageData),
      "metadata.totalMessages": FieldValue.increment(1),
      "metadata.lastMessageAt": FieldValue.serverTimestamp()
    })
    
    console.log(`[Chat Actions] Message created successfully: ${messageId}`)
    
    return {
      isSuccess: true,
      message: "Message created successfully",
      data: messageData
    }
  } catch (error) {
    // Don't log the full error object to avoid Next.js serialization issues
    const errorMessage = error instanceof Error ? error.message : "Failed to create message"
    console.log("[Chat Actions] Error creating message:", errorMessage)
    return { isSuccess: false, message: errorMessage }
  }
}

// Get chat history
export async function getChatHistoryAction(
  chatId: string,
  userId: string
): Promise<ActionState<{ messages: ChatMessage[], chat: FirebaseChat }>> {
  console.log(`[Chat Actions] Getting history for chat: ${chatId}`)
  
  if (!db) {
    console.error("[Chat Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    // Get chat document
    const chatRef = db.collection(collections.chats).doc(chatId)
    const chatDoc = await chatRef.get()
    
    if (!chatDoc.exists) {
      console.log(`[Chat Actions] Chat not found: ${chatId}`)
      return { isSuccess: false, message: "Chat not found" }
    }
    
    const chatData = chatDoc.data() as FirebaseChat
    
    // Verify user owns this chat
    if (chatData.userId !== userId) {
      console.log(`[Chat Actions] Unauthorized access to chat: ${chatId}`)
      return { isSuccess: false, message: "Unauthorized" }
    }
    
    console.log(`[Chat Actions] Retrieved ${chatData.messages.length} messages`)
    
    return {
      isSuccess: true,
      message: "Chat history retrieved successfully",
      data: { messages: chatData.messages, chat: chatData }
    }
  } catch (error) {
    console.error("[Chat Actions] Error getting chat history:", error)
    return { isSuccess: false, message: "Failed to get chat history" }
  }
}

// Get all chats for a user
export async function getUserChatsAction(
  userId: string
): Promise<ActionState<FirebaseChat[]>> {
  // Validate input
  if (!userId) {
    return { isSuccess: false, message: "User ID is required" }
  }
  
  console.log(`[Chat Actions] Getting chats for user: ${userId}`)
  
  if (!db) {
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const chatsSnapshot = await db
      .collection(collections.chats)
      .where('userId', '==', userId)
      .orderBy('metadata.lastMessageAt', 'desc')
      .get()
    
    const chats = chatsSnapshot.docs.map(doc => {
      const data = doc.data()
      return serializeChat({
        ...data,
        chatId: doc.id
      })
    })
    
    console.log(`[Chat Actions] Retrieved ${chats.length} chats`)
    
    return {
      isSuccess: true,
      message: "Chats retrieved successfully",
      data: chats
    }
  } catch (error) {
    // Don't log the full error object to avoid Next.js serialization issues
    const errorMessage = error instanceof Error ? error.message : "Failed to get chats"
    console.log("[Chat Actions] Error getting user chats:", errorMessage)
    return { isSuccess: false, message: errorMessage }
  }
}

// Update chat title
export async function updateChatTitleAction(
  chatId: string,
  userId: string,
  title: string
): Promise<ActionState<FirebaseChat>> {
  console.log(`[Chat Actions] Updating title for chat: ${chatId}`)
  
  if (!db) {
    console.error("[Chat Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const chatRef = db.collection(collections.chats).doc(chatId)
    const chatDoc = await chatRef.get()
    
    if (!chatDoc.exists) {
      return { isSuccess: false, message: "Chat not found" }
    }
    
    const chatData = chatDoc.data() as FirebaseChat
    
    if (chatData.userId !== userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }
    
    await chatRef.update({
      'metadata.title': title,
      'metadata.lastMessageAt': FieldValue.serverTimestamp()
    })
    
    const updatedDoc = await chatRef.get()
    const updatedData = updatedDoc.data()
    const updatedChat = serializeChat({
      chatId: chatRef.id,
      ...updatedData
    })
    
    console.log(`[Chat Actions] Chat title updated successfully`)
    
    return {
      isSuccess: true,
      message: "Chat title updated successfully",
      data: updatedChat
    }
  } catch (error) {
    console.error("[Chat Actions] Error updating chat title:", error)
    return { isSuccess: false, message: "Failed to update chat title" }
  }
}

// Delete a chat
export async function deleteChatAction(
  chatId: string,
  userId: string
): Promise<ActionState<undefined>> {
  console.log(`[Chat Actions] Deleting chat: ${chatId}`)
  
  if (!db) {
    console.error("[Chat Actions] Database not initialized")
    return { isSuccess: false, message: "Database not initialized" }
  }
  
  try {
    const chatRef = db.collection(collections.chats).doc(chatId)
    const chatDoc = await chatRef.get()
    
    if (!chatDoc.exists) {
      return { isSuccess: false, message: "Chat not found" }
    }
    
    const chatData = chatDoc.data() as FirebaseChat
    
    if (chatData.userId !== userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }
    
    // Delete the chat
    await chatRef.delete()
    
    console.log(`[Chat Actions] Chat deleted successfully`)
    
    return {
      isSuccess: true,
      message: "Chat deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Chat Actions] Error deleting chat:", error)
    return { isSuccess: false, message: "Failed to delete chat" }
  }
} 