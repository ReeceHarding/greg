/**
 * Firebase Data Serialization Utilities
 * 
 * These utilities convert Firebase-specific objects (like Timestamps) 
 * into plain JavaScript objects that can be passed from server to client components
 */

import { Timestamp } from 'firebase-admin/firestore'

/**
 * Serializes a Firebase Timestamp or Date object to a plain JavaScript Date
 */
export function serializeTimestamp(timestamp: any): Date | null {
  console.log("[Firebase Serialize] Serializing timestamp:", typeof timestamp)
  
  if (!timestamp) {
    return null
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp
  }
  
  // Firebase Timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  
  // Raw Firestore timestamp with _seconds and _nanoseconds
  if (timestamp && typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000)
  }
  
  // Try to parse as string
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  
  console.warn("[Firebase Serialize] Could not serialize timestamp:", timestamp)
  return null
}

/**
 * Recursively serializes an object, converting all Firebase-specific types
 * to plain JavaScript objects
 */
export function serializeFirebaseData<T = any>(data: any): T {
  if (!data) return data
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirebaseData(item)) as T
  }
  
  // Handle timestamps
  if (data instanceof Timestamp || data?._seconds !== undefined) {
    return serializeTimestamp(data) as T
  }
  
  // Handle plain objects
  if (typeof data === 'object' && data.constructor === Object) {
    const serialized: any = {}
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Special handling for known timestamp fields
        if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp' || 
            key === 'dueDate' || key === 'submittedAt' || key === 'lastMessageAt') {
          serialized[key] = serializeTimestamp(data[key])
        } else {
          serialized[key] = serializeFirebaseData(data[key])
        }
      }
    }
    
    return serialized as T
  }
  
  // Return primitive values as-is
  return data
}

/**
 * Serializes a single document with common Firebase fields
 */
export function serializeDocument<T = any>(doc: any): T {
  return serializeFirebaseData(doc)
}

/**
 * Serializes an array of documents
 */
export function serializeDocuments<T = any>(docs: any[]): T[] {
  return docs.map(doc => serializeDocument<T>(doc))
} 