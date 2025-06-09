"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Calendar, FileText, Plus, Users, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { SerializedFirebaseAssignment } from "@/types/firebase-types"
import { format } from "date-fns"

interface AssignmentStat {
  assignmentId: string
  totalStudents: number
  completedCount: number
  pendingCount: number
  needsRevisionCount: number
  completionRate: number
}

interface AssignmentsManagementClientProps {
  initialAssignments: SerializedFirebaseAssignment[]
  assignmentStats: AssignmentStat[]
}

export default function AssignmentsManagementClient({ 
  initialAssignments,
  assignmentStats 
}: AssignmentsManagementClientProps) {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [isSeeding, setIsSeeding] = useState(false)
  
  console.log("[AssignmentsManagementClient] Rendering with", assignments.length, "assignments")
  
  // Helper to get stats for an assignment
  const getAssignmentStats = (assignmentId: string) => {
    return assignmentStats.find(stat => stat.assignmentId === assignmentId) || {
      assignmentId,
      totalStudents: 0,
      completedCount: 0,
      pendingCount: 0,
      needsRevisionCount: 0,
      completionRate: 0
    }
  }
  
  // Calculate overall stats
  const overallStats = {
    totalSubmissions: assignmentStats.reduce((sum, stat) => sum + stat.completedCount + stat.pendingCount + stat.needsRevisionCount, 0),
    totalCompleted: assignmentStats.reduce((sum, stat) => sum + stat.completedCount, 0),
    totalPending: assignmentStats.reduce((sum, stat) => sum + stat.pendingCount, 0),
    averageCompletion: assignmentStats.length > 0 
      ? Math.round(assignmentStats.reduce((sum, stat) => sum + stat.completionRate, 0) / assignmentStats.length)
      : 0
  }
  
  // Handle seeding assignments
  const handleSeedAssignments = async () => {
    console.log("[AssignmentsManagementClient] Seeding assignments")
    setIsSeeding(true)
    
    try {
      const response = await fetch("/api/admin/seed-assignments", {
        method: "POST",
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log("[AssignmentsManagementClient] Seed successful")
        toast({
          title: "Assignments Seeded",
          description: "Successfully created assignments for all 8 weeks",
        })
        
        // Refresh the page to show new assignments
        window.location.reload()
      } else {
        throw new Error(result.message || "Seed failed")
      }
    } catch (error) {
      console.error("[AssignmentsManagementClient] Seed error:", error)
      toast({
        title: "Seed Failed",
        description: "Failed to create assignments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }
  
  // Group assignments by week
  const assignmentsByWeek = assignments.reduce((acc, assignment) => {
    const week = assignment.weekNumber
    if (!acc[week]) acc[week] = []
    acc[week].push(assignment)
    return acc
  }, {} as Record<number, SerializedFirebaseAssignment[]>)
  
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>No Assignments Found</CardTitle>
          <CardDescription>
            You haven't created any assignments yet. Click the button below to seed sample assignments for all 8 weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleSeedAssignments}
            disabled={isSeeding}
            size="lg"
            className="gap-2"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Seeding Assignments...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Seed Sample Assignments
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.totalCompleted} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overallStats.totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need your review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all weeks
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Assignments by Week */}
      <div className="space-y-4">
        {Object.entries(assignmentsByWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, weekAssignments]) => (
            <Card key={week}>
              <CardHeader>
                <CardTitle className="text-lg">Week {week}</CardTitle>
                <CardDescription className="text-sm">
                  {weekAssignments.length} assignment{weekAssignments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weekAssignments
                    .sort((a, b) => a.order - b.order)
                    .map((assignment) => {
                      const stats = getAssignmentStats(assignment.assignmentId)
                      
                      return (
                        <div
                          key={assignment.assignmentId}
                          className="p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{assignment.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {assignment.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {assignment.theme}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileText className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Assignment Stats */}
                          <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span>{stats.totalStudents} students</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>{stats.completedCount} completed</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-orange-600" />
                              <span>{stats.pendingCount} pending</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              <span>{stats.needsRevisionCount} revisions</span>
                            </div>
                          </div>
                          
                          {/* Completion bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Completion</span>
                              <span className="font-medium">{stats.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                style={{ width: `${stats.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSeedAssignments} disabled={isSeeding}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isSeeding ? "animate-spin" : ""}`} />
          Re-seed Assignments
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Assignment
        </Button>
      </div>
    </div>
  )
} 