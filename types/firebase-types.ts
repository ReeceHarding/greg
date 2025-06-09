// AI Summer Camp Platform Firebase Types

import { Timestamp } from "firebase-admin/firestore"

// User types
export interface FirebaseUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: "student" | "admin"
  onboardingStatus: {
    cursorInstalled: boolean
    n8nAccountCreated: boolean
    domainConfigured: boolean
    hostingSetup: boolean
    completedAt: Timestamp | null
  }
  joinedAt: Timestamp
  lastActiveAt: Timestamp
  metadata: {
    timezone: string
    preferredLanguage: string
  }
}

// Video types
export interface FirebaseVideo {
  videoId: string // YouTube video ID
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string // YouTube video URL
  duration: number // seconds
  publishedAt: Timestamp
  channelId: string
  channelTitle: string
  transcript: string // full text
  transcriptChunks: TranscriptChunk[]
  tags: string[]
  viewCount: number
  importedAt: Timestamp
  lastUpdatedAt: Timestamp
}

export interface TranscriptChunk {
  chunkId: string
  text: string
  startTime: number
  endTime: number
  embedding?: number[] // vector for similarity search
}

// Assignment types
export interface FirebaseAssignment {
  assignmentId: string
  weekNumber: number
  dayNumber?: number | null
  title: string
  description: string
  requirements: {
    videoDemo: boolean
    githubRepo: boolean
    reflection: boolean
    supportingDocs: boolean
  }
  dueDate: Timestamp
  theme: string
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Submission types
export interface FirebaseSubmission {
  submissionId: string
  studentId: string // user UID
  assignmentId: string
  status: "not_started" | "in_progress" | "submitted" | "approved" | "needs_revision"
  content: {
    videoUrl?: string | null
    githubUrl?: string | null
    reflection?: string | null
    supportingFiles: SupportingFile[]
  }
  aiFeedback?: AIFeedback | null
  instructorFeedback?: InstructorFeedback | null
  submittedAt?: Timestamp | null
  lastUpdatedAt: Timestamp
}

export interface SupportingFile {
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: Timestamp
}

export interface AIFeedback {
  strengths: string[]
  improvements: string[]
  nextSteps: string[]
  overallScore: number // 1-10
  generatedAt: Timestamp
}

export interface InstructorFeedback {
  comments: string
  reviewerId: string
  reviewedAt: Timestamp
}

// Chat types
export interface FirebaseChat {
  chatId: string
  userId: string
  type: "video_learning" | "progress_assistant"
  messages: ChatMessage[]
  metadata: {
    totalMessages: number
    lastMessageAt: Timestamp
  }
  createdAt: Timestamp
}

export interface ChatMessage {
  messageId: string
  role: "user" | "assistant"
  content: string
  timestamp: Timestamp
  videoReferences?: VideoReference[] | null
}

export interface VideoReference {
  videoId: string
  startTime: number
  endTime: number
  relevanceScore: number
}

// Live session types
export interface FirebaseLiveSession {
  sessionId: string
  title: string
  description: string
  type: "office_hours" | "expert_workshop"
  zoomLink: string
  zoomMeetingId: string
  scheduledAt: Timestamp
  duration: number // minutes
  hostId: string
  guestSpeaker?: {
    name: string
    bio: string
    profileUrl: string
  } | null
  registeredStudents: string[] // user UIDs
  attendedStudents: string[] // user UIDs
  recordingUrl?: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Progress types
export interface FirebaseProgress {
  progressId: string
  studentId: string
  currentWeek: number
  assignmentsCompleted: string[] // assignment IDs
  videosWatched: VideoWatchRecord[]
  forumStats: {
    postsCreated: number
    repliesCreated: number
    upvotesReceived: number
    lastActiveAt: Timestamp
  }
  weeklyReports: WeeklyReport[]
  overallCompletionPercentage: number
  lastCalculatedAt: Timestamp
}

export interface VideoWatchRecord {
  videoId: string
  watchedDuration: number
  totalDuration: number
  lastWatchedAt: Timestamp
}

export interface WeeklyReport {
  weekNumber: number
  report: string // Claude-generated
  generatedAt: Timestamp
}

// Certificate types
export interface FirebaseCertificate {
  certificateId: string
  studentId: string
  studentName: string
  issuedAt: Timestamp
  certificateUrl: string
  verificationCode: string
  completionStats: {
    assignmentsCompleted: number
    totalAssignments: number
    liveSessionsAttended: number
    programDuration: number // days
  }
  metadata: {
    templateVersion: string
    issuerName: string
  }
}

// Admin log types
export interface FirebaseAdminLog {
  logId: string
  adminId: string
  action: string
  targetType: "student" | "submission" | "assignment" | "liveSession"
  targetId: string
  details: Record<string, any> // flexible based on action
  ipAddress: string
  userAgent: string
  timestamp: Timestamp
}

// Forum types (only if using custom forum)
export interface FirebaseForumPost {
  postId: string
  authorId: string
  title: string
  content: string
  category: "business_ideas" | "technical_help" | "marketing" | "general"
  tags: string[]
  upvotes: string[] // user UIDs
  replyCount: number
  viewCount: number
  isPinned: boolean
  isResolved: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  lastActivityAt: Timestamp
}

// Legacy types (to be removed after migration)
export interface FirebaseProfile {
  id?: string
  userId: string
  email: string
  displayName?: string
  photoURL?: string
  membership: "free" | "pro"
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

// Helper type for Firestore timestamps
export type FirestoreTimestamp = {
  seconds: number
  nanoseconds: number
  toDate: () => Date
}

// Serialized versions for client components (converts Timestamps to Date/string)
export type SerializedFirebaseVideo = Omit<FirebaseVideo, 'publishedAt' | 'importedAt' | 'lastUpdatedAt'> & {
  publishedAt: Date | string
  importedAt: Date | string
  lastUpdatedAt: Date | string
}

export type SerializedFirebaseLiveSession = Omit<FirebaseLiveSession, 'scheduledAt' | 'createdAt' | 'updatedAt'> & {
  scheduledAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export type SerializedFirebaseAssignment = Omit<FirebaseAssignment, 'dueDate' | 'createdAt' | 'updatedAt'> & {
  dueDate: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export type SerializedFirebaseSubmission = Omit<FirebaseSubmission, 'submittedAt' | 'lastUpdatedAt' | 'supportingFiles' | 'aiFeedback' | 'instructorFeedback'> & {
  submittedAt?: Date | string | null
  lastUpdatedAt: Date | string
  supportingFiles: Array<Omit<SupportingFile, 'uploadedAt'> & { uploadedAt: Date | string }>
  aiFeedback?: Omit<AIFeedback, 'generatedAt'> & { generatedAt: Date | string } | null
  instructorFeedback?: Omit<InstructorFeedback, 'reviewedAt'> & { reviewedAt: Date | string } | null
}
