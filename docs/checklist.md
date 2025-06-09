# AI Summer Camp Platform Implementation Checklist

## CRITICAL REQUIREMENTS:
- **ALL AI features MUST use Claude 4 Sonnet API exclusively - NO template systems, NO keyword matching, NO other LLMs**
- **NO custom video player development - use ONLY YouTube iframe embeds and Zoom meeting links**
- **For live sessions: share Zoom links ONLY - no embedded video conferencing**

## Firebase Setup
- **See [Firebase Setup Documentation](./firebase.md) for complete Firebase configuration, data schema, security rules, and implementation details** ✅

---

## Phase 1: Foundation (Zero Dependencies)

### Core Platform Architecture

#### Frontend Structure
- [x] **Create React Single Page Application**
  - Set up Next.js 14+ with App Router
  - Configure TypeScript for type safety
  - Install and configure Tailwind CSS for styling
  - Install Shadcn UI component library
  - Set up Framer Motion for animations
  - Configure ESLint and Prettier for code consistency

- [x] **Design System Implementation**
  - Create consistent color palette: primary (blue), secondary (gray), accent (green for success), destructive (red for errors)
  - Typography system: Use Inter font, establish heading sizes (h1: 48px, h2: 36px, h3: 24px, body: 16px)
  - Spacing system: Use 4px base unit (space-1: 4px, space-2: 8px, etc.)
  - Component library setup: buttons (primary, secondary, ghost), cards, modals, forms
  - Responsive breakpoints: mobile (640px), tablet (768px), desktop (1024px), wide (1280px)

- [x] **Routing Structure**
  - Public routes: `/` (landing), `/login`, `/signup`, `/about`, `/contact`
  - Protected student routes: `/dashboard`, `/dashboard/videos`, `/dashboard/assignments`, `/dashboard/chat`, `/dashboard/progress`
  - Protected admin routes: `/admin`, `/admin/students`, `/admin/assignments`, `/admin/sessions`, `/admin/content`
  - API routes: `/api/auth/*`, `/api/videos/*`, `/api/assignments/*`, `/api/ai/*`

- [x] **Layout Components**
  - **PublicLayout**: Header with logo, navigation (Home, About, Contact, Login), footer with links and copyright
  - **StudentLayout**: Sidebar navigation (Dashboard, Videos, Assignments, Chat, Progress), top bar with user profile dropdown
  - **AdminLayout**: Admin sidebar (Overview, Students, Content, Sessions, Settings), admin-specific top bar

#### Backend Structure
- [x] **Server Action Organization**
  - Create `actions/auth` directory for authentication actions
  - Create `actions/videos` directory for YouTube content management
  - Create `actions/assignments` directory for assignment CRUD operations
  - Create `actions/ai` directory for Claude API interactions
  - Create `actions/admin` directory for admin-specific operations
  - All actions must return `ActionState<T>` type with success/error states

- [x] **API Route Structure**
  - `/api/auth/session` - Handle session creation and validation
  - `/api/youtube/import` - Webhook for importing new videos
  - `/api/claude/chat` - Handle AI chat interactions
  - `/api/webhooks/zoom` - Handle Zoom meeting notifications

#### Expected Functionality After Phase 1:
- **What you should see**: Clean, responsive layout with proper routing
- **Test by**: Navigate to all routes, verify layouts render correctly
- **Mobile test**: Check responsive design on phone/tablet sizes
- **Performance**: Pages should load in under 2 seconds
- **Accessibility**: All interactive elements should be keyboard navigable

---

## Phase 2: Authentication Enhancement (Depends on: Core Platform) ✅

### Current Working System
- **Google OAuth Flow**: Working perfectly - users sign in with Google and are redirected to dashboard
- **Session Management**: Session cookies are created and managed properly
- **Database Creation**: User profiles are automatically created on first sign-in
- **Middleware Protection**: All protected routes redirect to login when not authenticated

### Only Missing Feature
- [x] **Admin Role Assignment**
  - Create Firebase Cloud Function to set custom claims
  - Only allow specific email addresses (stored in Firestore `adminEmails` collection)
  - Admin emails bypass student role assignment
  - Add "admin" custom claim to user token
  - Create simple UI in admin panel to add/remove admin emails

#### Expected Functionality After Phase 2 Enhancement:
- **What you should see**: Same auth flow but admin users see admin sidebar
- **Test by**: Add your email to adminEmails collection, sign out and back in
- **Verify**: Admin users can access /admin routes

---

## Phase 3: Content & Data Systems (Depends on: Authentication)

### Video Learning System

#### Frontend Implementation
- [x] **Videos Page UI** (`/dashboard/videos`) - Already completed with beautiful UI

#### Backend Implementation
- [x] **YouTube Data Import**
  - **Initial Import Function** (`actions/videos/import-channel-videos.ts`):
    1. Use YouTube Data API v3 with the configured API key
    2. Get channel ID from Greg Isenberg's channel URL
    3. Fetch all video IDs from channel (pagination required)
    4. For each video, fetch: title, description, thumbnail, duration, publishedAt
    5. Store in Firestore `videos` collection (already defined in db.ts)
    6. Set up daily Cloud Function to check for new videos

  - **Transcript Extraction** (`actions/videos/extract-transcripts.ts`):
    1. For each video in Firestore missing transcript
    2. Use YouTube Caption API to get captions
    3. Parse captions into clean text with timestamps
    4. Store full transcript in video document
    5. Create transcript chunks (1000 chars each) with timestamps
    6. Store chunks in subcollection for search

- [x] **Video Detail Page** (`/dashboard/videos/[videoId]`)
  - Create dynamic route for individual videos
  - YouTube iframe embed with responsive design
  - Show video details from Firestore
  - "Ask AI Assistant" button that opens chat with video context

### Assignment System

#### Frontend Implementation
- [x] **Assignments Dashboard UI** (`/dashboard/assignments`) - Already completed with beautiful UI

#### Backend Implementation
- [x] **Assignment Data Population**:
  - Create seed script to populate `assignments` collection with 8 weeks of content
  - Each assignment includes: weekNumber, title, description, requirements, theme
  - Calculate due dates dynamically based on student's join date

- [x] **Assignment Detail Page** (`/dashboard/assignments/[weekId]`)
  - Create dynamic route for each assignment
  - Show requirements and resources
  - Build submission form with file upload
  - Connect to submission workflow

- [x] **Submission Workflow**:
  1. Create submission document in `submissions` collection
  2. Validate video URLs (YouTube/Loom)
  3. Upload files to Firebase Storage: `/submissions/{userId}/{assignmentId}/`
  4. Update submission status and progress tracking
  5. Trigger AI feedback generation (Phase 4)

### Student Onboarding Flow

#### Implementation
- [x] **Onboarding Modal**
  - Check user's `onboardingStatus` from database
  - Show modal on first dashboard visit if not completed
  - Track completion of each tool setup
  - Update user document when all steps complete

### Live Sessions System

#### Implementation
- [x] **Sessions Page** (`/dashboard/sessions`)
  - Create new page with Google Calendar embed
  - Below calendar, show upcoming sessions from `liveSessions` collection
  - Add "Get Zoom Link" functionality
  - RSVP tracking in database

- [x] **Session Management**:
  - Admin interface to create sessions in `liveSessions` collection
  - Store Zoom links securely (only visible to registered students)
  - Track RSVPs and attendance

#### Expected Functionality After Phase 3:
- **What you should see**: 
  - Videos populated from YouTube
  - Working assignment submission system
  - Onboarding flow for new users
  - Live sessions with calendar
- **Test by**:
  - Run video import script
  - Submit a test assignment
  - Complete onboarding flow
  - RSVP for a session

---

## Phase 4: AI & Intelligence Layer (Weeks 7-8)

### Week 7: AI Integration Setup
- [x] Set up Claude API integration with proper error handling
- [x] Implement streaming responses for chat interface
- [x] Create chat persistence with Firestore
- [x] Build video transcript search functionality

### Week 8: AI Features
- [x] Create AI chat interface for student support
- [x] Implement automatic assignment feedback generation
- [x] Build progress tracking with AI insights
- [x] Add smart notifications for important updates

---

## Phase 5: Submission & Review Systems (Depends on: Assignment System)

### Assignment Submission Portal

#### Frontend Implementation
- [ ] **Enhanced Submission Form UI**
  - **Multi-step Form Design**:
    - Step 1: Video Demo URL
      - Preview player when URL entered
      - Validation for YouTube/Loom URLs
      - "Test Link" button
    
    - Step 2: Project Details
      - GitHub URL with validation
      - Tech stack used (tag selector)
      - Project description (rich text editor)
    
    - Step 3: Reflection
      - Guided prompts: "What did you learn?", "What was challenging?"
      - Word count progress bar
      - Auto-save every 30 seconds
    
    - Step 4: Supporting Files
      - Drag-drop zone with file type icons
      - Progress bars for uploads
      - File size limits clearly shown
      - Preview for images, list for other files

- [ ] **Submission Preview Modal**
  - Shows all entered information formatted nicely
  - "Edit" buttons for each section
  - Final confirmation before submit
  - Success animation after submission

#### Backend Implementation
- [ ] **File Upload Handling**:
  1. Validate file types: images, PDFs, zip files only
  2. Check file sizes: max 10MB per file, 50MB total
  3. Scan files for security (basic check)
  4. Upload to Firebase Storage with unique paths
  5. Generate signed URLs for secure access
  6. Store file metadata in submission document

### Instructor Review Interface

#### Frontend Implementation
- [ ] **Review Dashboard** (`/admin/reviews`)
  - **Review Queue**:
    - Filterable table: All, Pending, In Review, Completed
    - Columns: Student, Assignment, Submitted Date, Status
    - Sort by date, assignment, or student name
    - Bulk actions: assign to reviewer, mark as reviewed
  
  - **Review Interface** (`/admin/reviews/[submissionId]`)
    - **Three-panel Layout**:
      - Left (3/12): Student info and history
      - Center (6/12): Submission content
      - Right (3/12): Feedback panel
    
    - **Student Panel**:
      - Profile photo and name
      - Previous submissions list
      - Overall progress indicator
      - Quick stats: attendance, completion rate
    
    - **Submission Panel**:
      - Embedded video player
      - All submission content formatted
      - AI feedback displayed (collapsible)
      - Download links for files
    
    - **Feedback Panel**:
      - AI feedback at top for reference
      - Rich text editor for instructor comments
      - Quick feedback templates
      - Approval status dropdown
      - "Request Revision" with specific asks
      - "Send Feedback" button

#### Backend Implementation
- [ ] **Review Workflow**:
  1. Load all pending submissions
  2. Sort by priority (late submissions first)
  3. When instructor opens review:
     - Mark as "in review" 
     - Lock from other reviewers
     - Load all related data
  4. On feedback submission:
     - Validate required fields
     - Store in Firestore
     - Update submission status
     - Send email to student
     - Release lock for next review

#### Expected Functionality After Phase 5:
- **What you should see**:
  - Polished submission forms with validation
  - File upload with progress tracking
  - Complete instructor review interface
  - Email notifications working
- **Test by**:
  - Submit assignment with all components
  - Review as instructor and provide feedback
  - Check student receives notification
  - Verify files accessible in review interface

---

## Phase 6: Analytics & Gamification 
[x] User progress tracking and badges
    - [x] Points system in FirebaseProgress type
    - [x] Badge definitions and checking logic  
    - [x] Points calculation on submission approval
    - [x] Streak tracking and daily updates
[x] Points system and leaderboard
    - [x] Leaderboard page at /dashboard/leaderboard
    - [x] Top students display with badges
    - [x] Points breakdown and achievements
[x] Admin analytics dashboard
    - [x] Analytics page at /admin/analytics
    - [x] Key metrics display (active students, completion rates)
    - [x] Daily active users chart
    - [x] Assignment completion by week
    - [x] At-risk students identification

## Phase 7: Landing Page Enhancement
[x] Update landing page copy  
    - [x] Hero section speaks to students wanting to learn AI
    - [x] About section explains AI Summer Camp program
    - [x] CTA focused on joining the program
[x] Add entrepreneur success stories
    - [x] Replaced testimonials with real entrepreneur tweets
    - [x] Young founders making money with AI (Pieter Levels, Danny Postma, etc.)
    - [x] Inspiring students to build AI businesses
[x] Update pricing for AI Summer Camp
    - [x] Self-paced option at $497
    - [x] Cohort-based option at $997
    - [x] Social proof and student success metrics