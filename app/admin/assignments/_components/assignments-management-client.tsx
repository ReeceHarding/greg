"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Calendar, FileText, Plus } from "lucide-react"
import { SerializedFirebaseAssignment } from "@/types/firebase-types"
import { format } from "date-fns"

interface AssignmentsManagementClientProps {
  initialAssignments: SerializedFirebaseAssignment[]
}

export default function AssignmentsManagementClient({ 
  initialAssignments 
}: AssignmentsManagementClientProps) {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [isSeeding, setIsSeeding] = useState(false)
  
  console.log("[AssignmentsManagementClient] Rendering with", assignments.length, "assignments")
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Weeks Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(assignmentsByWeek).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Next Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(assignments[0].dueDate), "MMM d")}
            </div>
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
                <CardDescription>
                  {weekAssignments.length} assignment{weekAssignments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weekAssignments
                    .sort((a, b) => a.order - b.order)
                    .map((assignment) => (
                      <div
                        key={assignment.assignmentId}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                            </span>
                            <Badge variant="secondary">
                              {assignment.theme}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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