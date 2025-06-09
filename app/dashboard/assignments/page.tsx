"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllAssignmentsAction } from "@/actions/db/assignments-actions"
import { getSubmissionsByStudentAction } from "@/actions/db/submissions-actions"
import Link from "next/link"

export default async function AssignmentsPage() {
  console.log("[AssignmentsPage] Checking authentication")
  const user = await auth()
  
  if (!user || !user.userId) {
    console.log("[AssignmentsPage] No authenticated user, redirecting to login")
    redirect("/login")
  }

  console.log("[AssignmentsPage] Rendering assignments page for user:", user.userId)
  
  // Fetch real assignments from database
  const assignmentsResult = await getAllAssignmentsAction()
  const assignments = assignmentsResult.isSuccess ? assignmentsResult.data || [] : []
  
  // Fetch user's submissions
  const submissionsResult = await getSubmissionsByStudentAction(user.userId)
  const submissions = submissionsResult.isSuccess ? submissionsResult.data || [] : []
  
  console.log(`[AssignmentsPage] Fetched ${assignments.length} assignments and ${submissions.length} submissions`)

  // Map assignments to week format with submission status
  const weeks = assignments.map(assignment => {
    const submission = submissions.find(s => s.assignmentId === assignment.assignmentId)
    
    // Calculate status
    let status: "completed" | "in-progress" | "not-started" = "not-started"
    let progress = 0
    
    if (submission) {
      if (submission.status === "approved" || submission.status === "submitted") {
        status = "completed"
        progress = 100
      } else if (submission.status === "in_progress") {
        status = "in-progress"
        progress = 50
      }
    }
    
    // Calculate due date info
    const dueDate = assignment.dueDate ? 
      (assignment.dueDate as any).toDate?.() || new Date(assignment.dueDate as any) : 
      new Date()
    const now = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    let dueIn = ""
    if (status === "completed") {
      dueIn = "Completed"
    } else if (daysUntilDue < 0) {
      dueIn = "Past due"
    } else if (daysUntilDue === 0) {
      dueIn = "Due today"
    } else if (daysUntilDue === 1) {
      dueIn = "Due tomorrow"
    } else {
      dueIn = `Due in ${daysUntilDue} days`
    }
    
    return {
      id: `week${assignment.weekNumber}`,
      title: `Week ${assignment.weekNumber}`,
      theme: assignment.theme,
      status,
      description: assignment.description,
      dueIn,
      progress,
      assignmentId: assignment.assignmentId,
      weekNumber: assignment.weekNumber
    }
  })

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Weekly Assignments
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Complete hands-on assignments to build your AI-powered business step by step
            </p>
          </div>

          {/* Progress Overview */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Your Progress</h2>
                <p className="text-muted-foreground">You're making great progress! Keep up the momentum.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">2/8</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">92%</div>
                  <div className="text-sm text-muted-foreground">On Track</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Navigation Tabs */}
          <div className="mb-12">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {weeks.map((week) => (
                <button
                  key={week.id}
                  className={`
                    px-6 py-3 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap
                    ${week.status === "completed" 
                      ? "bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(34,197,94,0.3)]" 
                      : week.status === "in-progress"
                      ? "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                      : "bg-white border border-border hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {week.status === "completed" && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {week.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {weeks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No assignments available yet.</p>
                <p className="text-sm text-muted-foreground">Check back soon for your weekly assignments!</p>
              </div>
            ) : (
              weeks.map((week) => (
              <div
                key={week.id}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border transition-all duration-300 border-border/40 hover:border-primary/30 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:scale-[1.02]"
              >
                {/* Status Badge */}
                {week.status === "completed" && (
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg z-10">
                    <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-8">
                  {/* Week Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold">{week.title}</h3>
                      {week.status === "in-progress" && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-semibold text-primary mb-2">{week.theme}</h4>
                    <p className="text-muted-foreground">{week.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Progress</span>
                      <span className="text-sm font-bold">{week.progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          week.status === "completed" 
                            ? "bg-gradient-to-r from-accent to-accent/80" 
                            : "bg-gradient-to-r from-primary to-primary/80"
                        }`}
                        style={{ width: `${week.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="mb-6">
                    <p className={`text-sm font-medium ${
                      week.status === "completed" ? "text-accent" : 
                      week.dueIn.includes("Due in") ? "text-primary" : 
                      "text-muted-foreground"
                    }`}>
                      {week.dueIn}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/dashboard/assignments/${week.weekNumber}`}
                    className={`
                      block w-full py-4 px-6 rounded-2xl font-medium transition-all duration-200 text-center
                      ${week.status === "completed"
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : week.status === "in-progress"
                        ? "bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transform hover:-translate-y-0.5"
                        : "bg-white border border-primary text-primary hover:bg-primary hover:text-white"
                      }
                    `}
                  >
                    {week.status === "not-started" && "Start Assignment"}
                    {week.status === "in-progress" && "Continue Assignment"}
                    {week.status === "completed" && "View Submission"}
                  </Link>

                  {/* Additional Actions for Active Assignments */}
                  {(week.status === "in-progress" || week.status === "not-started") && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <button className="text-muted-foreground hover:text-primary transition-colors duration-200">
                        View Requirements
                      </button>
                      <button className="text-muted-foreground hover:text-primary transition-colors duration-200">
                        Get Help
                      </button>
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>

          {/* Help Section */}
          <div className="mt-16 p-8 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl border border-border/40">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
                <p className="text-muted-foreground">
                  Get support from our AI assistant, join office hours, or connect with other students in the community.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-white border border-border rounded-2xl font-medium hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200">
                  Ask AI Assistant
                </button>
                <button className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-all duration-200">
                  Join Office Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 