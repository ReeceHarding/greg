"use server"

import { db, collections } from "@/db/db"
import { ChatMessage } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Create a new message
export async function createMessageAction(
  chatId: string,
  data: Omit<ChatMessage, 'messageId' | 'timestamp'>
): Promise<ActionState<ChatMessage>> {
  console.log("[createMessageAction] Creating message for chat:", chatId)
  
  try {
    if (!db) {
      console.error("[createMessageAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const messageData = {
      ...data,
      chatId,
      timestamp: FieldValue.serverTimestamp()
    }
    
    console.log("[createMessageAction] Creating message document in Firestore")
    const docRef = await db.collection(collections.messages).add(messageData)
    const newMessage = await docRef.get()
    const messageWithId = { messageId: docRef.id, ...newMessage.data() } as unknown as ChatMessage
    
    console.log("[createMessageAction] Message created successfully with ID:", docRef.id)
    
    // Update the chat's lastMessageAt timestamp
    await db.collection(collections.chats).doc(chatId).update({
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    })
    
    return {
      isSuccess: true,
      message: "Message created successfully",
      data: messageWithId
    }
  } catch (error) {
    console.error("[createMessageAction] Error creating message:", error)
    return { isSuccess: false, message: "Failed to create message" }
  }
}

// Read messages for a chat
export async function getChatMessagesAction(
  chatId: string,
  limit: number = 50
): Promise<ActionState<ChatMessage[]>> {
  console.log("[getChatMessagesAction] Fetching messages for chat:", chatId)
  
  try {
    if (!db) {
      console.error("[getChatMessagesAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const snapshot = await db
      .collection(collections.messages)
      .where('chatId', '==', chatId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    
    const messages = snapshot.docs.map(doc => ({
      messageId: doc.id,
      ...doc.data()
    })) as unknown as ChatMessage[]
    
    // Reverse to get chronological order
    messages.reverse()
    
    console.log("[getChatMessagesAction] Fetched", messages.length, "messages")
    
    return {
      isSuccess: true,
      message: "Messages fetched successfully",
      data: messages
    }
  } catch (error) {
    console.error("[getChatMessagesAction] Error fetching messages:", error)
    return { isSuccess: false, message: "Failed to fetch messages" }
  }
}

// Read a single message by ID
export async function getMessageAction(
  messageId: string
): Promise<ActionState<ChatMessage>> {
  console.log("[getMessageAction] Fetching message with ID:", messageId)
  
  try {
    if (!db) {
      console.error("[getMessageAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const doc = await db.collection(collections.messages).doc(messageId).get()
    
    if (!doc.exists) {
      console.log("[getMessageAction] Message not found with ID:", messageId)
      return { isSuccess: false, message: "Message not found" }
    }
    
    const message = { messageId: doc.id, ...doc.data() } as unknown as ChatMessage
    console.log("[getMessageAction] Message fetched successfully")
    
    return {
      isSuccess: true,
      message: "Message fetched successfully",
      data: message
    }
  } catch (error) {
    console.error("[getMessageAction] Error fetching message:", error)
    return { isSuccess: false, message: "Failed to fetch message" }
  }
}

// Update a message (for editing)
export async function updateMessageAction(
  messageId: string,
  content: string
): Promise<ActionState<ChatMessage>> {
  console.log("[updateMessageAction] Updating message with ID:", messageId)
  
  try {
    if (!db) {
      console.error("[updateMessageAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const updateData = {
      content,
      edited: true,
      editedAt: FieldValue.serverTimestamp()
    }
    
    console.log("[updateMessageAction] Updating message document in Firestore")
    await db.collection(collections.messages).doc(messageId).update(updateData)
    
    const updatedDoc = await db.collection(collections.messages).doc(messageId).get()
    const updatedMessage = { messageId: updatedDoc.id, ...updatedDoc.data() } as unknown as ChatMessage
    
    console.log("[updateMessageAction] Message updated successfully")
    return {
      isSuccess: true,
      message: "Message updated successfully",
      data: updatedMessage
    }
  } catch (error) {
    console.error("[updateMessageAction] Error updating message:", error)
    return { isSuccess: false, message: "Failed to update message" }
  }
}

// Delete a message
export async function deleteMessageAction(
  messageId: string
): Promise<ActionState<undefined>> {
  console.log("[deleteMessageAction] Deleting message with ID:", messageId)
  
  try {
    if (!db) {
      console.error("[deleteMessageAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    await db.collection(collections.messages).doc(messageId).delete()
    
    console.log("[deleteMessageAction] Message deleted successfully")
    return {
      isSuccess: true,
      message: "Message deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[deleteMessageAction] Error deleting message:", error)
    return { isSuccess: false, message: "Failed to delete message" }
  }
}

// Get messages with pagination
export async function getChatMessagesPaginatedAction(
  chatId: string,
  pageSize: number = 20,
  lastMessageId?: string
): Promise<ActionState<{ messages: ChatMessage[]; hasMore: boolean }>> {
  console.log("[getChatMessagesPaginatedAction] Fetching paginated messages for chat:", chatId)
  
  try {
    if (!db) {
      console.error("[getChatMessagesPaginatedAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    let query = db
      .collection(collections.messages)
      .where('chatId', '==', chatId)
      .orderBy('timestamp', 'desc')
      .limit(pageSize + 1) // Get one extra to check if there are more
    
    // If we have a last message ID, start after it
    if (lastMessageId) {
      const lastDoc = await db.collection(collections.messages).doc(lastMessageId).get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }
    
    const snapshot = await query.get()
    
    let messages = snapshot.docs.map(doc => ({
      messageId: doc.id,
      ...doc.data()
    })) as unknown as ChatMessage[]
    
    // Check if there are more messages
    const hasMore = messages.length > pageSize
    if (hasMore) {
      messages = messages.slice(0, pageSize)
    }
    
    // Reverse to get chronological order
    messages.reverse()
    
    console.log("[getChatMessagesPaginatedAction] Fetched", messages.length, "messages, hasMore:", hasMore)
    
    return {
      isSuccess: true,
      message: "Messages fetched successfully",
      data: { messages, hasMore }
    }
  } catch (error) {
    console.error("[getChatMessagesPaginatedAction] Error fetching paginated messages:", error)
    return { isSuccess: false, message: "Failed to fetch messages" }
  }
} 