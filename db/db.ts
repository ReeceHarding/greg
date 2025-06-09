/*
<ai_context>
Initializes the Firebase Firestore database connection for the app.
</ai_context>
*/

import { adminDb } from "@/lib/firebase-config"

// Log initialization status
if (adminDb) {
  console.log("[DB] Firebase Firestore initialized")
} else {
  console.warn("[DB] Firebase Firestore not available - adminDb is null")
  console.warn(
    "[DB] Database operations will not work without proper Firebase configuration"
  )
}

// Export the Firestore instance (may be null if Firebase is not configured)
export const db = adminDb

// Collection references for AI Summer Camp Platform
export const collections = {
  // Core collections
  users: "users",
  videos: "videos",
  assignments: "assignments",
  submissions: "submissions",
  chats: "chats",
  liveSessions: "liveSessions",
  progress: "progress",
  certificates: "certificates",
  adminLogs: "adminLogs",
  forumPosts: "forumPosts",
  
  // Legacy collections (to be removed)
  profiles: "profiles", // migrated to users collection
  todos: "todos", // not used in AI Summer Camp
  messages: "messages" // migrated to chats collection
}

console.log("[DB] Available collections:", Object.keys(collections))
