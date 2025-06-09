# Project File Structure

Last updated: June 2025

## Root Directory
- `package.json` - Project dependencies and scripts
- `.env.local` - Local environment variables (gitignored)
- `.env.example` - Example environment variables template
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `middleware.ts` - Next.js middleware for auth
- `components.json` - Shadcn UI components configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules

## /app Directory (Next.js App Router)
### Authentication Pages
- `/app/(auth)/` - Auth layout wrapper
  - `login/[[...login]]/page.tsx` - Clerk login page
  - `signup/[[...signup]]/page.tsx` - Clerk signup page

### Marketing Pages
- `/app/(marketing)/` - Marketing layout
  - `page.tsx` - Landing page
  - `about/page.tsx` - About page
  - `contact/page.tsx` - Contact page
  - `pricing/page.tsx` - Pricing page with components

### Dashboard Pages
- `/app/dashboard/` - Protected dashboard
  - `layout.tsx` - Dashboard layout with sidebar
  - `page.tsx` - Dashboard home
  - `videos/` - Video learning system
    - `page.tsx` - Videos list
    - `[videoId]/page.tsx` - Individual video page
  - `assignments/` - Assignment system
    - `page.tsx` - Assignments list
    - `[weekId]/page.tsx` - Assignment detail/submission
  - `sessions/` - Live sessions
    - `page.tsx` - Sessions calendar and list
  - `chat/page.tsx` - AI chat assistant
  - `progress/page.tsx` - Progress tracking
  - `billing/page.tsx` - Billing management

### Admin Pages
- `/app/admin/` - Admin panel
  - `layout.tsx` - Admin layout
  - `page.tsx` - Admin dashboard
  - `students/page.tsx` - Student management
  - `content/page.tsx` - Content management
  - `assignments/page.tsx` - Assignment management
  - `sessions/` - Session management
    - `page.tsx` - Sessions list
    - `_components/` - Session management components
      - `admin-sessions-client.tsx` - Client component for CRUD
      - `admin-sessions-skeleton.tsx` - Loading skeleton
  - `data/page.tsx` - Data analytics
  - `settings/page.tsx` - Admin settings

### API Routes
- `/app/api/`
  - `auth/session/route.ts` - Session management
  - `claude/chat/route.ts` - Claude AI integration
  - `stripe/webhooks/route.ts` - Stripe webhook handler
  - `youtube/`
    - `import/route.ts` - YouTube import endpoint
    - `test/route.ts` - YouTube API test endpoint
  - `webhooks/zoom/route.ts` - Zoom webhook handler
  - `admin/seed-assignments/route.ts` - Seed assignments

## /actions Directory (Server Actions)
- `/actions/`
  - `admin/` - Admin-specific actions
    - `admin-role-actions.ts` - Admin role management
  - `ai/` - AI-related actions
    - `claude-actions.ts` - Claude API integration
  - `assignments/` - Assignment actions
    - `assignment-actions.ts` - CRUD for assignments
    - `submission-actions.ts` - Handle submissions
  - `auth/` - Authentication actions
    - `auth-actions.ts` - Auth helpers
  - `db/` - Database actions
    - `user-actions.ts` - User management
    - `sessions-actions.ts` - Live sessions CRUD
  - `storage/` - Storage actions
    - `upload-actions.ts` - File upload handling
  - `videos/` - Video actions
    - `video-actions.ts` - Video CRUD operations
    - `import-channel-videos.ts` - YouTube import
    - `extract-transcripts.ts` - Transcript extraction

## /components Directory
- `/components/`
  - `landing/` - Landing page components
  - `magicui/` - Magic UI components
  - `sidebar/` - Sidebar components
    - `app-sidebar.tsx` - Main app sidebar
    - `admin-sidebar.tsx` - Admin sidebar
    - `nav-user.tsx` - User navigation
  - `ui/` - Shadcn UI components
  - `utilities/` - Utility components
    - `onboarding-modal.tsx` - Onboarding flow
    - `posthog/` - Analytics components

## /db Directory
- `db.ts` - Firestore database configuration
- `migrations/` - Database migrations (if any)

## /lib Directory
- `firebase-config.ts` - Firebase Admin SDK setup
- `firebase-client.ts` - Firebase Client SDK setup
- `firebase-auth.ts` - Firebase Auth helpers
- `hooks/` - Custom React hooks

## /types Directory
- `index.ts` - Re-exports all types
- `firebase-types.ts` - Firebase/Firestore types
- `actions-types.ts` - Action return types

## /scripts Directory
- `seed-assignments.ts` - Populate assignments
- `import-youtube-channel.ts` - Import YouTube videos
- `test-transcript-extraction.ts` - Test transcript extraction
- `extract-all-transcripts.ts` - Bulk extract transcripts
- `fix-video-dates.ts` - Fix video published dates
- `add-video-urls.ts` - Add YouTube URLs to videos
- `setup-daily-video-check.ts` - Daily video check setup

## /public Directory
- Static assets (images, fonts, etc.)

## /secrets Directory
- `firebase-service-account.json` - Firebase admin credentials (gitignored)

## Key Features Implementation Status
- ✅ Authentication (Firebase Auth + Clerk)
- ✅ Video Learning System (YouTube import, transcripts)
- ✅ Assignment System (submission, file upload)
- ✅ Live Sessions (CRUD, RSVP)
- ✅ Admin Panel (user, content, session management)
- ✅ AI Chat Integration (Claude API)
- ✅ Student Onboarding Flow
- ⏳ Stripe Payments (partial)
- ⏳ Progress Tracking (UI only)
- ⏳ Certificate Generation 