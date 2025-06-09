"use server"

import { adminStorage } from '@/lib/firebase-config'
import { ActionState } from '@/types'

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
]

// File type to extension mapping
const FILE_TYPE_EXTENSIONS: { [key: string]: string[] } = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/zip': ['.zip'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt']
}

// Validate file type and size
export async function validateFile(
  fileName: string,
  fileSize: number,
  contentType: string
): Promise<{ valid: boolean; error?: string }> {
  console.log(`[Storage Action] Validating file: ${fileName}, size: ${fileSize}, type: ${contentType}`)
  
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(contentType)) {
    return { valid: false, error: 'File type not allowed' }
  }
  
  // Check file extension matches content type
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  const allowedExtensions = FILE_TYPE_EXTENSIONS[contentType] || []
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'File extension does not match content type' }
  }
  
  return { valid: true }
}

// Basic virus scan placeholder (would integrate with actual scanning service)
export async function scanFile(buffer: Buffer): Promise<{ safe: boolean; threat?: string }> {
  console.log('[Storage Action] Scanning file for threats...')
  
  // This is a placeholder - in production, integrate with a real virus scanning service
  // like ClamAV, VirusTotal API, or cloud-based solutions
  
  // Basic checks for now
  const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1000))
  
  // Check for common script patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onclick=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.write/i
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(bufferString)) {
      return { safe: false, threat: 'Potentially malicious script detected' }
    }
  }
  
  return { safe: true }
}

export async function uploadFileStorageAction(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
  fileName?: string
): Promise<ActionState<{ path: string; url: string }>> {
  console.log('[Storage Action] Uploading file to:', path)
  
  if (!adminStorage) {
    console.error('[Storage Action] Firebase Storage is not initialized')
    return { isSuccess: false, message: "Storage service not available" }
  }
  
  try {
    // Validate file if fileName provided
    if (fileName) {
      const validation = await validateFile(fileName, buffer.length, contentType)
      if (!validation.valid) {
        console.error('[Storage Action] File validation failed:', validation.error)
        return { isSuccess: false, message: validation.error || "File validation failed" }
      }
    }
    
    // Scan file for threats
    const scanResult = await scanFile(buffer)
    if (!scanResult.safe) {
      console.error('[Storage Action] File scan failed:', scanResult.threat)
      return { isSuccess: false, message: scanResult.threat || "File contains potential security threats" }
    }
    
    const file = adminStorage.bucket(bucket).file(path)
    
    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        cacheControl: 'private, max-age=3600', // 1 hour cache
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileSize: buffer.length.toString()
        }
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

// Validate multiple files for submission
export async function validateSubmissionFilesAction(
  files: Array<{ name: string; size: number; type: string }>
): Promise<ActionState<{ valid: boolean; errors: string[] }>> {
  console.log('[Storage Action] Validating submission files:', files.length)
  
  const errors: string[] = []
  let totalSize = 0
  
  // Check each file
  for (const file of files) {
    const validation = await validateFile(file.name, file.size, file.type)
    if (!validation.valid) {
      errors.push(`${file.name}: ${validation.error}`)
    }
    totalSize += file.size
  }
  
  // Check total size
  if (totalSize > MAX_TOTAL_SIZE) {
    errors.push(`Total file size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit`)
  }
  
  // Check file count
  if (files.length > 5) {
    errors.push('Maximum 5 files allowed per submission')
  }
  
  return {
    isSuccess: true,
    message: errors.length === 0 ? "All files are valid" : "File validation failed",
    data: {
      valid: errors.length === 0,
      errors
    }
  }
}

// Generate unique file path for submissions
export async function generateSubmissionFilePath(
  userId: string,
  assignmentId: string,
  fileName: string
): Promise<string> {
  // Sanitize filename
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const timestamp = Date.now()
  const extension = sanitized.substring(sanitized.lastIndexOf('.'))
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
  
  return `submissions/${userId}/${assignmentId}/${timestamp}_${nameWithoutExt}${extension}`
} 