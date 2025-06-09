# Firebase Setup and Data Schema Documentation

This document contains all Firebase configuration, setup instructions, and data schema definitions for the AI Summer Camp Platform.

## Firebase Project Configuration

- [ ] Configure Firebase Project with proper authentication and database structure
  - [ ] Install Firebase CLI globally: `npm install -g firebase-tools`
  - [ ] Run `firebase login` to authenticate with your Google account
  - [ ] Initialize Firebase in project: `firebase init` and select Firestore, Storage, Functions, and Hosting
  - [ ] Set up proper security rules for Firestore and Storage
  - [ ] Configure Firebase Admin SDK with service account credentials
  - [ ] Set environment variables for all Firebase configuration values

## Firestore Data Schema

### Users Collection (`users`)
```
{
  uid: string (Firebase Auth UID),
  email: string,
  displayName: string,
  photoURL: string,
  role: "student" | "admin",
  onboardingStatus: {
    cursorInstalled: boolean,
    n8nAccountCreated: boolean,
    domainConfigured: boolean,
    hostingSetup: boolean,
    completedAt: timestamp | null
  },
  joinedAt: timestamp,
  lastActiveAt: timestamp,
  metadata: {
    timezone: string,
    preferredLanguage: string
  }
}
```

### Videos Collection (`videos`)
```
{
  videoId: string (YouTube video ID),
  title: string,
  description: string,
  thumbnailUrl: string,
  duration: number (seconds),
  publishedAt: timestamp,
  channelId: string,
  channelTitle: string,
  transcript: string (full text),
  transcriptChunks: [{
    chunkId: string,
    text: string,
    startTime: number,
    endTime: number,
    embedding: array<number> (vector for similarity search)
  }],
  tags: array<string>,
  viewCount: number,
  importedAt: timestamp,
  lastUpdatedAt: timestamp
}
```

### Assignments Collection (`assignments`)
```
{
  assignmentId: string,
  weekNumber: number,
  dayNumber: number | null,
  title: string,
  description: string,
  requirements: {
    videoDemo: boolean,
    githubRepo: boolean,
    reflection: boolean,
    supportingDocs: boolean
  },
  dueDate: timestamp,
  theme: string,
  order: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Submissions Collection (`submissions`)
```
{
  submissionId: string,
  studentId: string (user UID),
  assignmentId: string,
  status: "not_started" | "in_progress" | "submitted" | "approved" | "needs_revision",
  content: {
    videoUrl: string | null,
    githubUrl: string | null,
    reflection: string | null,
    supportingFiles: [{
      fileName: string,
      fileUrl: string,
      fileType: string,
      uploadedAt: timestamp
    }]
  },
  aiFeedback: {
    strengths: array<string>,
    improvements: array<string>,
    nextSteps: array<string>,
    overallScore: number (1-10),
    generatedAt: timestamp
  } | null,
  instructorFeedback: {
    comments: string,
    reviewerId: string,
    reviewedAt: timestamp
  } | null,
  submittedAt: timestamp | null,
  lastUpdatedAt: timestamp
}
```

### Chats Collection (`chats`)
```
{
  chatId: string,
  userId: string,
  type: "video_learning" | "progress_assistant",
  messages: [{
    messageId: string,
    role: "user" | "assistant",
    content: string,
    timestamp: timestamp,
    videoReferences: [{
      videoId: string,
      startTime: number,
      endTime: number,
      relevanceScore: number
    }] | null
  }],
  metadata: {
    totalMessages: number,
    lastMessageAt: timestamp
  },
  createdAt: timestamp
}
```

### LiveSessions Collection (`liveSessions`)
```
{
  sessionId: string,
  title: string,
  description: string,
  type: "office_hours" | "expert_workshop",
  zoomLink: string,
  zoomMeetingId: string,
  scheduledAt: timestamp,
  duration: number (minutes),
  hostId: string,
  guestSpeaker: {
    name: string,
    bio: string,
    profileUrl: string
  } | null,
  registeredStudents: array<string> (user UIDs),
  attendedStudents: array<string> (user UIDs),
  recordingUrl: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Progress Collection (`progress`)
```
{
  progressId: string,
  studentId: string,
  currentWeek: number,
  assignmentsCompleted: array<string> (assignment IDs),
  videosWatched: [{
    videoId: string,
    watchedDuration: number,
    totalDuration: number,
    lastWatchedAt: timestamp
  }],
  forumStats: {
    postsCreated: number,
    repliesCreated: number,
    upvotesReceived: number,
    lastActiveAt: timestamp
  },
  weeklyReports: [{
    weekNumber: number,
    report: string (Claude-generated),
    generatedAt: timestamp
  }],
  overallCompletionPercentage: number,
  lastCalculatedAt: timestamp
}
```

### Certificates Collection (`certificates`)
```
{
  certificateId: string,
  studentId: string,
  studentName: string,
  issuedAt: timestamp,
  certificateUrl: string,
  verificationCode: string,
  completionStats: {
    assignmentsCompleted: number,
    totalAssignments: number,
    liveSessionsAttended: number,
    programDuration: number (days)
  },
  metadata: {
    templateVersion: string,
    issuerName: string
  }
}
```

### AdminLogs Collection (`adminLogs`)
```
{
  logId: string,
  adminId: string,
  action: string,
  targetType: "student" | "submission" | "assignment" | "liveSession",
  targetId: string,
  details: object (flexible based on action),
  ipAddress: string,
  userAgent: string,
  timestamp: timestamp
}
```

### ForumPosts Collection (`forumPosts`) - Only if using custom forum
```
{
  postId: string,
  authorId: string,
  title: string,
  content: string,
  category: "business_ideas" | "technical_help" | "marketing" | "general",
  tags: array<string>,
  upvotes: array<string> (user UIDs),
  replyCount: number,
  viewCount: number,
  isPinned: boolean,
  isResolved: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastActivityAt: timestamp
}
```

## Firestore Composite Indexes

Create the following composite indexes for optimal query performance:

- **submissions** - `(studentId ASC, submittedAt DESC)` for student submission history
- **submissions** - `(assignmentId ASC, status ASC)` for assignment status tracking
- **submissions** - `(status ASC, submittedAt DESC)` for instructor review queue
- **videos** - `(channelId ASC, publishedAt DESC)` for channel video listing
- **chats** - `(userId ASC, createdAt DESC)` for user chat history
- **liveSessions** - `(scheduledAt ASC)` for upcoming sessions
- **progress** - `(overallCompletionPercentage DESC, lastCalculatedAt DESC)` for leaderboard
- **forumPosts** - `(category ASC, lastActivityAt DESC)` for category browsing
- **adminLogs** - `(adminId ASC, timestamp DESC)` for admin activity tracking

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isStudent() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Videos collection (read-only for students)
    match /videos/{videoId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Assignments collection (read-only for students)
    match /assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      allow read: if isAuthenticated() && 
        (isOwner(resource.data.studentId) || isAdmin());
      allow create: if isStudent() && 
        isOwner(request.resource.data.studentId);
      allow update: if (isOwner(resource.data.studentId) && 
        resource.data.status != 'approved') || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && 
        isOwner(resource.data.userId);
      allow read: if isAdmin();
    }
    
    // Progress collection
    match /progress/{progressId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Other collections follow similar patterns...
  }
}
```

## Firebase Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User uploads (submissions)
    match /submissions/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
    
    // Certificates
    match /certificates/{allPaths=**} {
      allow read: if true; // Public for verification
      allow write: if false; // Only through Cloud Functions
    }
    
    // Admin uploads
    match /admin/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.role == 'admin';
    }
  }
}
```

## Related Files

- **Database Configuration**: `/db/db.ts`
- **Type Definitions**: `/types/firebase-types.ts`
- **Firebase Client Config**: `/lib/firebase-client.ts`
- **Firebase Admin Config**: `/lib/firebase-config.ts`
- **Firebase Auth Helpers**: `/lib/firebase-auth.ts` 