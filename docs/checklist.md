# AI Summer Camp Platform Implementation Checklist

## CRITICAL REQUIREMENTS:
- **ALL AI features MUST use Claude 4 Sonnet API exclusively - NO template systems, NO keyword matching, NO other LLMs**
- **NO custom video player development - use ONLY YouTube iframe embeds and Zoom meeting links**
- **For live sessions: share Zoom links ONLY - no embedded video conferencing**

## Firebase Setup
- **See [Firebase Setup Documentation](./firebase.md) for complete Firebase configuration, data schema, security rules, and implementation details** ✅

## Phase 1: Foundation (Zero Dependencies)

### Core Platform Architecture
- [ ] Create a single page application using React that integrates Firebase services and third-party APIs to serve as the foundation for the AI Summer Camp platform
  - [ ] Set up the React application with proper routing to handle student dashboard, admin dashboard, and landing page navigation
  - [x] Configure Firebase project with authentication, Firestore database, Storage, and Cloud Functions services
  - [ ] Implement role-based access control with exactly two roles: "student" and "admin" (where admin includes instructor privileges)
  - [ ] Design and implement a modern, sleek UI with consistent design patterns across all platform components

## Phase 2: Authentication Layer (Depends on: Core Platform)

### Student Authentication System
- [ ] Implement Google OAuth authentication using Firebase Auth for all student signups
  - [ ] Configure Google OAuth provider in Firebase console with proper scopes
  - [ ] Build login page with prominent "Sign in with Google" button
  - [ ] Automatically assign "student" role to all new Google OAuth signups
  - [ ] Implement session management using Firebase session cookies
  - [ ] Create separate admin login flow that requires pre-approved email addresses

## Phase 3: Content & Data Systems (Depends on: Authentication)

### Video Learning System with AI Timestamp Suggestions
- [ ] Build video learning system that imports all videos from Greg Isenberg's YouTube channel (NO custom video player)
  - [ ] Set up YouTube Data API v3 with API key and configure quota management
  - [ ] Create Cloud Function that fetches all videos from Greg Isenberg's channel ID and stores metadata in Firestore
  - [ ] Implement automatic transcript extraction using YouTube's caption API and store in Firestore
  - [ ] Use ONLY YouTube's standard iframe embed for videos (absolutely NO custom video player development)
  - [ ] Create clickable timestamp links that open YouTube videos in new tabs at specific timestamps

### Assignment and Progress Tracking System
- [ ] Build assignment system organized around weekly entrepreneurship themes with specific deliverables
  - [ ] Create weekly modules with the following themes and requirements:
    - [ ] **Day 1: Finding Your Niche** - Submit research report on profitable opportunities using Google Trends, subreddits, and idea validation tools
    - [ ] **Week 1: Building an Audience and Finding Your Startup Idea** - Submit video demo of validated business concept and content strategy plan
    - [ ] **Week 2: Vibe Code Fully Functional MVP** - Submit video demo of working MVP built with Bolt/Lovable/Cursor including GitHub repo link
    - [ ] **Week 3-4: Iteration on MVP** - Submit video demo showing customer feedback implementation and feature improvements
    - [ ] **Week 5-6: Vibe Marketing and Automation** - Submit video demo of n8n automations and proof of 100+ person waitlist (week 5) / 1000+ person waitlist (week 6)
    - [ ] **Week 7-8: Turn Users Into Paying Customers** - Submit video demo of customer acquisition strategies and first user testimonials
  - [ ] Implement simple weekly form for each submission including:
    - [ ] Video demo URL field (required - typically YouTube or Loom link)
    - [ ] GitHub repository link field (optional - for code submissions)
    - [ ] Written reflection text area (500 word limit) about weekly learnings
    - [ ] Supporting documents upload (screenshots, spreadsheets, etc.)
  - [ ] **Use shared Google Calendar embed for schedule display (NO custom calendar development)**
  - [ ] Track status for each submission: "Not Started", "In Progress", "Submitted", "Approved", "Needs Revision"
  - [ ] Use a charting library (e.g., Recharts, Chart.js) for progress bars and visualizations

### Student Onboarding Flow
- [ ] Design simple guided setup process for required entrepreneurship tools
  - [ ] Create onboarding checklist with clear steps: "Install Cursor AI Editor", "Create n8n automation account", "Configure domain and hosting"
  - [ ] Provide direct links to tool signups with any available discount codes or free credits
  - [ ] Include estimated setup time for each tool (e.g., "Cursor setup: 10 minutes")
  - [ ] Display progress bar showing percentage of onboarding completed

### Live Sessions and Office Hours System
- [ ] Build live video session system for weekly calls and office hours using Zoom links only
  - [ ] **NOTE: Simply provide manual Zoom links to students - no API integration needed**
  - [ ] **Embed shared Google Calendar iframe showing upcoming office hours and weekly expert calls**
  - [ ] Implement session registration where students RSVP to receive Zoom meeting links
  - [ ] Send automated emails with Zoom meeting links 24 hours and 1 hour before each live session
  - [ ] Store recording links after sessions for students who missed the live call

## Phase 4: AI-Powered Features (Depends on: Video System, Assignment System)

### AI Chatbot for Video Learning
- [ ] Develop AI chatbot powered by Claude 4 Sonnet (NOT a template system) that analyzes video transcripts and suggests relevant timestamps
  - [ ] Build chat interface in student dashboard with message history and real-time typing indicators
  - [ ] Integrate Anthropic Claude 4 Sonnet API specifically - do NOT use any template systems or other LLMs
  - [ ] Send actual video transcript content to Claude 4 Sonnet for intelligent analysis (not keyword matching)
  - [ ] Implement transcript chunking strategy to work within Claude 4 Sonnet's 200k token context limit
  - [ ] Use Pinecone or another vector database service (not custom built) for semantic transcript search
  - [ ] Parse Claude 4 Sonnet's natural language responses to extract timestamp ranges and format them as clickable video links

### Student Communication System
- [ ] Integrate Claude 4 Sonnet chatbot for personalized progress queries (NOT a rule-based system)
  - [ ] Send student questions directly to Claude 4 Sonnet API with their progress data as context
  - [ ] Let Claude 4 Sonnet naturally answer "What assignments do I have due this week?" based on data
  - [ ] Have Claude 4 Sonnet calculate and respond to "What's my current completion percentage?"
  - [ ] Provide Claude 4 Sonnet with individual student context for personalized responses

### AI-Powered Progress Insights
- [ ] Create AI-powered insights dashboard for student progress using Claude 4 Sonnet exclusively
  - [ ] Use Claude 4 Sonnet to generate weekly progress reports analyzing completion rate and engagement
  - [ ] Have Claude 4 Sonnet identify struggling areas and suggest specific Greg Isenberg videos to review
  - [ ] Use Claude 4 Sonnet to recommend peer students for collaboration based on complementary skills
  - [ ] Generate personalized encouragement messages with Claude 4 Sonnet when students hit milestones

## Phase 5: Submission & Review Systems (Depends on: Assignment System)

### Assignment Submission Portal
- [ ] Create flexible submission system supporting entrepreneurship-focused assignments
  - [ ] Build submission form accepting: live website URLs, GitHub repos, video demos
  - [ ] Use a third-party drag-and-drop file upload library (e.g., react-dropzone) for file uploads
  - [ ] Use a third-party rich text editor library (e.g., Quill, TinyMCE) for reflections
  - [ ] Add special fields for n8n workflow exports and automation documentation
  - [ ] Build submission preview before final submit with ability to edit

### AI-Powered Assignment Feedback
- [ ] Develop AI-powered feedback for assignments using Claude 4 Sonnet ONLY
  - [ ] Create Cloud Function that sends assignment content to Claude 4 Sonnet API for analysis (NOT templates)
  - [ ] Use Claude 4 Sonnet to analyze business model viability and provide constructive feedback
  - [ ] Have Claude 4 Sonnet review code quality and best practices for technical submissions
  - [ ] Send n8n workflows to Claude 4 Sonnet for efficiency analysis and improvement suggestions
  - [ ] Parse Claude 4 Sonnet's responses to format feedback with clear sections: strengths, improvements needed, next steps

### Instructor Review Interface
- [ ] Build unified review dashboard where any admin/instructor can review any student's work
  - [ ] Create global assignment queue showing all pending submissions from all students
  - [ ] Display student name, submission timestamp, and assignment type in the queue
  - [ ] Design split-screen interface showing student submission, AI feedback, and instructor comment area
  - [ ] Implement rich text editor for instructors to provide detailed feedback
  - [ ] Build approval/revision request system with clear status indicators

## Phase 6: Analytics & Gamification (Depends on: Assignment System, Submission System)

### Simple Leaderboard System
- [ ] Create leaderboard that ranks students by progress and engagement
  - [ ] Design leaderboard UI showing student rankings based on assignment completion and participation
  - [ ] Implement ranking algorithm based on: assignment completion (60%), forum participation (40%)
  - [ ] Display progress milestones with badges (25%, 50%, 75%, 100% completion)
  - [ ] Show weekly "most active" students to encourage participation

### Admin Dashboard Student Management
- [ ] Develop student management interface for administrators
  - [ ] Build filterable student list with status indicators: "On Track", "Behind Schedule", "Completed"
  - [ ] Create detailed student profile views showing progress metrics and engagement statistics
  - [ ] Implement assignment completion history timeline for each student
  - [ ] Add quick action buttons for common administrative tasks

## Phase 7: Community Features (Depends on: Authentication)

### Collaborative Forum System
- [ ] Integrate a third-party forum solution or use a forum library for student discussions
  - [ ] Consider using Discourse API, Forem, or a React forum component library
  - [ ] Configure categories for different topics (business ideas, technical help, marketing)
  - [ ] Enable rich text posting using the chosen forum's built-in editor
  - [ ] Configure the forum's built-in threading and reply system
  - [ ] Use the forum's native voting/reaction features
  - [ ] Configure user profiles to sync with Firebase Auth

## Phase 8: Completion & Polish (Depends on: All Other Systems)

### Certificate Generation System
- [ ] Build automated certificate system for program completion
  - [ ] Create certificate template with professional design including student name, completion date, and unique ID
  - [ ] Define completion requirements: all core assignments completed, attendance at minimum number of live sessions
  - [ ] Use a PDF generation library (e.g., jsPDF, Puppeteer) to create certificates automatically
  - [ ] Store certificates in Firebase Storage with unique verification URLs
  - [ ] Create public verification page where anyone can verify certificate authenticity

### Mobile Responsive Implementation
- [ ] Ensure all platform features work seamlessly on mobile devices
  - [ ] Implement responsive design for student dashboard, YouTube embeds (standard iframe only), and chat interface
  - [ ] Create mobile-optimized navigation with hamburger menu and touch gestures
  - [ ] Ensure assignment submission works on mobile with camera integration for screenshots
  - [ ] Ensure YouTube iframe embeds work on mobile (NO custom video player optimizations)
