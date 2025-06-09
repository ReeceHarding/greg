"use server"

import { db, collections } from "@/db/db"
import { FirebaseChat } from "@/types/firebase-types"
import { ActionState } from "@/types"
import { FieldValue } from 'firebase-admin/firestore'

// Create a new chat
export async function createChatAction(
  data: Omit<FirebaseChat, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActionState<FirebaseChat>> {
  console.log("[createChatAction] Starting chat creation for user:", data.userId)
  
  try {
    if (!db) {
      console.error("[createChatAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const chatData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    
    console.log("[createChatAction] Creating chat document in Firestore")
    const docRef = await db.collection(collections.chats).add(chatData)
    const newChat = await docRef.get()
    const chatDocData = newChat.data()
    
    if (!chatDocData) {
      console.error("[createChatAction] Failed to retrieve created chat data")
      return { isSuccess: false, message: "Failed to retrieve created chat" }
    }
    
    const chatWithId = {
      id: docRef.id,
      ...chatDocData
    } as unknown as FirebaseChat
    
    console.log("[createChatAction] Chat created successfully with ID:", docRef.id)
    return {
      isSuccess: true,
      message: "Chat created successfully",
      data: chatWithId
    }
  } catch (error) {
    console.error("[createChatAction] Error creating chat:", error)
    return { isSuccess: false, message: "Failed to create chat" }
  }
}

// Read a single chat by ID
export async function getChatAction(
  chatId: string
): Promise<ActionState<FirebaseChat>> {
  console.log("[getChatAction] Fetching chat with ID:", chatId)
  
  try {
    if (!db) {
      console.error("[getChatAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const doc = await db.collection(collections.chats).doc(chatId).get()
    
    if (!doc.exists) {
      console.log("[getChatAction] Chat not found with ID:", chatId)
      return { isSuccess: false, message: "Chat not found" }
    }
    
    const chatData = doc.data()
    if (!chatData) {
      console.error("[getChatAction] Chat data is empty")
      return { isSuccess: false, message: "Chat data is empty" }
    }
    
    const chat = {
      id: doc.id,
      ...chatData
    } as unknown as FirebaseChat
    
    console.log("[getChatAction] Chat fetched successfully")
    
    return {
      isSuccess: true,
      message: "Chat fetched successfully",
      data: chat
    }
  } catch (error) {
    console.error("[getChatAction] Error fetching chat:", error)
    return { isSuccess: false, message: "Failed to fetch chat" }
  }
}

// Read all chats for a user
export async function getUserChatsAction(
  userId: string
): Promise<ActionState<FirebaseChat[]>> {
  console.log("[getUserChatsAction] Fetching chats for user:", userId)
  
  try {
    if (!db) {
      console.error("[getUserChatsAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const snapshot = await db
      .collection(collections.chats)
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get()
    
    const chats = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data
      } as unknown as FirebaseChat
    })
    
    console.log("[getUserChatsAction] Fetched", chats.length, "chats for user")
    
    return {
      isSuccess: true,
      message: "Chats fetched successfully",
      data: chats
    }
  } catch (error) {
    console.error("[getUserChatsAction] Error fetching user chats:", error)
    return { isSuccess: false, message: "Failed to fetch chats" }
  }
}

// Update a chat
export async function updateChatAction(
  chatId: string,
  data: Partial<Omit<FirebaseChat, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>
): Promise<ActionState<FirebaseChat>> {
  console.log("[updateChatAction] Updating chat with ID:", chatId)
  
  try {
    if (!db) {
      console.error("[updateChatAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    }
    
    console.log("[updateChatAction] Updating chat document in Firestore")
    await db.collection(collections.chats).doc(chatId).update(updateData)
    
    const updatedDoc = await db.collection(collections.chats).doc(chatId).get()
    const updatedDocData = updatedDoc.data()
    
    if (!updatedDocData) {
      console.error("[updateChatAction] Failed to retrieve updated chat data")
      return { isSuccess: false, message: "Failed to retrieve updated chat" }
    }
    
    const updatedChat = {
      id: updatedDoc.id,
      ...updatedDocData
    } as unknown as FirebaseChat
    
    console.log("[updateChatAction] Chat updated successfully")
    return {
      isSuccess: true,
      message: "Chat updated successfully",
      data: updatedChat
    }
  } catch (error) {
    console.error("[updateChatAction] Error updating chat:", error)
    return { isSuccess: false, message: "Failed to update chat" }
  }
}

// Delete a chat and all its messages
export async function deleteChatAction(
  chatId: string
): Promise<ActionState<undefined>> {
  console.log("[deleteChatAction] Deleting chat with ID:", chatId)
  
  try {
    if (!db) {
      console.error("[deleteChatAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    // Start a batch operation to delete chat and all its messages
    const batch = db.batch()
    
    // Delete the chat document
    const chatRef = db.collection(collections.chats).doc(chatId)
    batch.delete(chatRef)
    
    // Delete all messages in this chat
    console.log("[deleteChatAction] Fetching messages to delete for chat:", chatId)
    const messagesSnapshot = await db
      .collection(collections.messages)
      .where('chatId', '==', chatId)
      .get()
    
    console.log("[deleteChatAction] Found", messagesSnapshot.size, "messages to delete")
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // Commit the batch
    console.log("[deleteChatAction] Executing batch delete")
    await batch.commit()
    
    console.log("[deleteChatAction] Chat and messages deleted successfully")
    return {
      isSuccess: true,
      message: "Chat deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[deleteChatAction] Error deleting chat:", error)
    return { isSuccess: false, message: "Failed to delete chat" }
  }
}

// Get chat with message count
export async function getChatWithStatsAction(
  chatId: string
): Promise<ActionState<FirebaseChat & { messageCount: number }>> {
  console.log("[getChatWithStatsAction] Fetching chat with stats for ID:", chatId)
  
  try {
    if (!db) {
      console.error("[getChatWithStatsAction] Firestore is not initialized")
      return { isSuccess: false, message: "Database connection failed" }
    }

    // Get the chat
    const chatDoc = await db.collection(collections.chats).doc(chatId).get()
    
    if (!chatDoc.exists) {
      console.log("[getChatWithStatsAction] Chat not found with ID:", chatId)
      return { isSuccess: false, message: "Chat not found" }
    }
    
    const chatDocData = chatDoc.data()
    if (!chatDocData) {
      console.error("[getChatWithStatsAction] Chat data is empty")
      return { isSuccess: false, message: "Chat data is empty" }
    }
    
    const chat = {
      id: chatDoc.id,
      ...chatDocData
    } as unknown as FirebaseChat
    
    // Get message count
    const messagesSnapshot = await db
      .collection(collections.messages)
      .where('chatId', '==', chatId)
      .count()
      .get()
    
    const messageCount = messagesSnapshot.data().count
    
    console.log("[getChatWithStatsAction] Chat fetched with", messageCount, "messages")
    
    return {
      isSuccess: true,
      message: "Chat with stats fetched successfully",
      data: { ...chat, messageCount }
    }
  } catch (error) {
    console.error("[getChatWithStatsAction] Error fetching chat with stats:", error)
    return { isSuccess: false, message: "Failed to fetch chat with stats" }
  }
} 