"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown,
  Eye,
  FileText,
  Users,
  TrendingUp
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface SubmissionWithDetails {
  submissionId: string
  studentId: string
  studentName: string
  studentEmail: string
  assignmentId: string
  assignmentTitle: string
  weekNumber: number
  status: string
  submittedAt?: any
  aiFeedback?: any
  instructorFeedback?: any
}

interface ReviewDashboardClientProps {
  submissions: SubmissionWithDetails[]
}

export default function ReviewDashboardClient({ submissions }: ReviewDashboardClientProps) {
  console.log("[ReviewDashboardClient] Rendering with", submissions.length, "submissions")
  
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "student" | "assignment">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  
  // Calculate stats
  const stats = useMemo(() => {
    const pending = submissions.filter(s => s.status === "submitted" && !s.instructorFeedback)
    const inReview = submissions.filter(s => s.status === "submitted" && s.instructorFeedback && s.instructorFeedback.reviewerId)
    const completed = submissions.filter(s => s.status === "approved" || s.instructorFeedback)
    
    return {
      pending: pending.length,
      inReview: inReview.length,
      completed: completed.length,
      total: submissions.length
    }
  }, [submissions])
  
  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => {
        if (statusFilter === "pending") return s.status === "submitted" && !s.instructorFeedback
        if (statusFilter === "in_review") return s.status === "submitted" && s.instructorFeedback && !s.instructorFeedback.reviewedAt
        if (statusFilter === "completed") return s.status === "approved" || s.instructorFeedback?.reviewedAt
        return true
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === "date") {
        const dateA = a.submittedAt ? new Date(a.submittedAt.seconds * 1000) : new Date(0)
        const dateB = b.submittedAt ? new Date(b.submittedAt.seconds * 1000) : new Date(0)
        comparison = dateA.getTime() - dateB.getTime()
      } else if (sortBy === "student") {
        comparison = a.studentName.localeCompare(b.studentName)
      } else if (sortBy === "assignment") {
        comparison = a.weekNumber - b.weekNumber
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    return filtered
  }, [submissions, searchQuery, statusFilter, sortBy, sortOrder])
  
  const handleSort = (column: "date" | "student" | "assignment") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }
  
  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    )
  }
  
  const handleSelectAll = () => {
    if (selectedSubmissions.length === filteredSubmissions.length) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(filteredSubmissions.map(s => s.submissionId))
    }
  }
  
  const handleBulkAction = (action: string) => {
    if (selectedSubmissions.length === 0) {
      toast.error("No submissions selected")
      return
    }
    
    console.log(`[ReviewDashboardClient] Bulk action: ${action} on ${selectedSubmissions.length} submissions`)
    toast.info(`${action} ${selectedSubmissions.length} submissions`)
    // TODO: Implement bulk actions
  }
  
  const getStatusBadge = (submission: SubmissionWithDetails) => {
    if (submission.status === "approved") {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    } else if (submission.instructorFeedback) {
      return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
    } else if (submission.aiFeedback) {
      return <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Submitted</Badge>
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Being reviewed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Reviewed</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>Manage and review student submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("mark_reviewed")}
                disabled={selectedSubmissions.length === 0}
              >
                Mark as Reviewed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("assign_reviewer")}
                disabled={selectedSubmissions.length === 0}
              >
                Assign Reviewer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, email, or assignment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Submissions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("student")}
                  >
                    <div className="flex items-center gap-1">
                      Student
                      {sortBy === "student" && (
                        sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("assignment")}
                  >
                    <div className="flex items-center gap-1">
                      Assignment
                      {sortBy === "assignment" && (
                        sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Submitted
                      {sortBy === "date" && (
                        sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.submissionId}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.includes(submission.submissionId)}
                          onChange={() => handleSelectSubmission(submission.submissionId)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.studentName}</p>
                          <p className="text-sm text-muted-foreground">{submission.studentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">Week {submission.weekNumber}</p>
                          <p className="text-sm text-muted-foreground">{submission.assignmentTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt ? (
                          <div>
                            <p className="text-sm">
                              {format(new Date(submission.submittedAt.seconds * 1000), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(submission.submittedAt.seconds * 1000), "h:mm a")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not submitted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/reviews/${submission.submissionId}`)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
