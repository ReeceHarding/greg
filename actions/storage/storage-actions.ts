"use server"

import { adminStorage } from '@/lib/firebase-config'
import { ActionState } from '@/types'

export async function uploadFileStorageAction(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<ActionState<{ path: string; url: string }>> {
  console.log('[Storage Action] Uploading file to:', path)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    const file = adminStorage.bucket(bucket).file(path)
    
    await file.save(buffer, {
      metadata: {
        contentType: contentType
      }
    })
    
    console.log('[Storage Action] File uploaded successfully')
    
    // Generate a signed URL for the file
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    console.log('[Storage Action] Generated signed URL')
    
    return {
      isSuccess: true,
      message: "File uploaded successfully",
      data: { path, url }
    }
  } catch (error) {
    console.error("[Storage Action] Error uploading file:", error)
    return { isSuccess: false, message: "Failed to upload file" }
  }
}

export async function downloadFileStorageAction(
  bucket: string,
  path: string
): Promise<ActionState<{ url: string }>> {
  console.log('[Storage Action] Downloading file from:', path)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    const file = adminStorage.bucket(bucket).file(path)
    
    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      console.log('[Storage Action] File not found')
      return { isSuccess: false, message: "File not found" }
    }
    
    // Generate a signed URL for download
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    })
    
    console.log('[Storage Action] Generated download URL')
    
    return {
      isSuccess: true,
      message: "Download URL generated successfully",
      data: { url }
    }
  } catch (error) {
    console.error("[Storage Action] Error downloading file:", error)
    return { isSuccess: false, message: "Failed to generate download URL" }
  }
}

export async function deleteFileStorageAction(
  bucket: string,
  path: string
): Promise<ActionState<void>> {
  console.log('[Storage Action] Deleting file:', path)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    const file = adminStorage.bucket(bucket).file(path)
    
    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      console.log('[Storage Action] File not found, nothing to delete')
      return {
        isSuccess: true,
        message: "File not found or already deleted",
        data: undefined
      }
    }
    
    await file.delete()
    console.log('[Storage Action] File deleted successfully')
    
    return {
      isSuccess: true,
      message: "File deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("[Storage Action] Error deleting file:", error)
    return { isSuccess: false, message: "Failed to delete file" }
  }
}

export async function listFilesStorageAction(
  bucket: string,
  prefix: string
): Promise<ActionState<string[]>> {
  console.log('[Storage Action] Listing files with prefix:', prefix)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    const [files] = await adminStorage.bucket(bucket).getFiles({
      prefix: prefix
    })
    
    const filePaths = files.map(file => file.name)
    console.log('[Storage Action] Found', filePaths.length, 'files')
    
    return {
      isSuccess: true,
      message: "Files listed successfully",
      data: filePaths
    }
  } catch (error) {
    console.error("[Storage Action] Error listing files:", error)
    return { isSuccess: false, message: "Failed to list files" }
  }
}

export async function getFileMetadataStorageAction(
  bucket: string,
  path: string
): Promise<ActionState<{
  size: number
  contentType: string
  created: string
  updated: string
}>> {
  console.log('[Storage Action] Getting metadata for:', path)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    const file = adminStorage.bucket(bucket).file(path)
    const [metadata] = await file.getMetadata()
    
    console.log('[Storage Action] Metadata retrieved successfully')
    
    return {
      isSuccess: true,
      message: "Metadata retrieved successfully",
      data: {
        size: typeof metadata.size === 'number' ? metadata.size : parseInt(metadata.size || '0'),
        contentType: metadata.contentType || 'application/octet-stream',
        created: metadata.timeCreated || new Date().toISOString(),
        updated: metadata.updated || new Date().toISOString()
      }
    }
  } catch (error) {
    console.error("[Storage Action] Error getting file metadata:", error)
    return { isSuccess: false, message: "Failed to get file metadata" }
  }
} 