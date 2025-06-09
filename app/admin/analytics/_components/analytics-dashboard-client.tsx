"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Activity,
  BarChart,
  PieChart,
  Calendar,
  Download,
  Mail,
  ChevronUp,
  ChevronDown,
  Eye
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface EngagementData {
  dailyActiveUsers: { date: string; activeUsers: number }[]
  assignmentsByWeek: { week: number; completed: number; submitted: number; total: number }[]
  studentStatusDistribution: { active: number; inactive: number; atRisk: number }
  videoEngagement: { title: string; views: number }[]
}

interface AnalyticsDashboardClientProps {
  totalStudents: number
  activeStudents: number
  completedSubmissions: number
  pendingSubmissions: number
  averageCompletion: number
  engagementData: EngagementData
  atRiskStudents: {
    studentId: string
    name: string
    email: string
    completionRate: number
    lastActive: string | null
    currentWeek: number
  }[]
}

export default function AnalyticsDashboardClient({
  totalStudents,
  activeStudents,
  completedSubmissions,
  pendingSubmissions,
  averageCompletion,
  engagementData,
  atRiskStudents
}: AnalyticsDashboardClientProps) {
  console.log("[AnalyticsDashboardClient] Rendering analytics dashboard")
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<"7d" | "30d" | "all">("30d")
  const [showExportOptions, setShowExportOptions] = useState(false)
  
  // Calculate trends (mock data - in real app, compare with previous period)
  const activeStudentsTrend = "+12%"
  const completionTrend = "+5%"
  const submissionsTrend = "+23"
  
  const handleExportData = (format: "csv" | "pdf") => {
    console.log(`[AnalyticsDashboardClient] Exporting data as ${format}`)
    toast.info(`Exporting analytics data as ${format.toUpperCase()}...`)
    // TODO: Implement actual export functionality
  }
  
  const handleEmailStudent = (studentId: string, name: string) => {
    console.log(`[AnalyticsDashboardClient] Emailing student: ${studentId}`)
    toast.info(`Opening email to ${name}...`)
    // TODO: Implement email functionality
  }
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">All enrolled students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active This Week</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {activeStudentsTrend} from last week
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {completionTrend} from last cohort
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions}</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {submissionsTrend} new this week
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>Student activity over time</CardDescription>
              </div>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="text-sm border rounded-md px-3 py-1"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-1">
              {engagementData.dailyActiveUsers.slice(-14).map((day, index) => {
                const maxUsers = Math.max(...engagementData.dailyActiveUsers.map(d => d.activeUsers))
                const height = (day.activeUsers / maxUsers) * 100
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-purple-200 hover:bg-purple-300 rounded-t transition-all duration-200 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.activeUsers} users
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{format(new Date(engagementData.dailyActiveUsers[0].date), "MMM d")}</span>
              <span>{format(new Date(engagementData.dailyActiveUsers[engagementData.dailyActiveUsers.length - 1].date), "MMM d")}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Assignment Completion by Week */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Completion by Week</CardTitle>
            <CardDescription>Progress through the program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementData.assignmentsByWeek.map((week) => {
                const completionRate = week.total > 0 ? (week.completed / week.total) * 100 : 0
                const submissionRate = week.total > 0 ? (week.submitted / week.total) * 100 : 0
                
                return (
                  <div key={week.week}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Week {week.week}</span>
                      <span className="text-sm text-muted-foreground">
                        {week.completed}/{week.total} completed
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={completionRate} className="h-8" />
                      {submissionRate > completionRate && (
                        <div
                          className="absolute top-0 left-0 h-full bg-orange-300 rounded-full transition-all duration-500"
                          style={{ width: `${submissionRate}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-300 rounded" />
                <span>Submitted</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Student Status Distribution & At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Student Status Distribution</CardTitle>
            <CardDescription>Current activity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Active</span>
                </div>
                <span className="text-sm font-semibold">{engagementData.studentStatusDistribution.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span className="text-sm">Inactive</span>
                </div>
                <span className="text-sm font-semibold">{engagementData.studentStatusDistribution.inactive}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">At Risk</span>
                </div>
                <span className="text-sm font-semibold">{engagementData.studentStatusDistribution.atRisk}</span>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="mt-6 h-32 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(engagementData.studentStatusDistribution.active / totalStudents) * 352} 352`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {Math.round((engagementData.studentStatusDistribution.active / totalStudents) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* At-Risk Students */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>At-Risk Students</CardTitle>
                <CardDescription>Students needing intervention</CardDescription>
              </div>
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {atRiskStudents.length} students
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No at-risk students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    atRiskStudents.slice(0, 5).map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={student.completionRate} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground">{student.completionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {student.lastActive ? 
                              format(new Date(student.lastActive), "MMM d") : 
                              "Never"
                            }
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `/admin/students/${student.studentId}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEmailStudent(student.studentId, student.name)}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {atRiskStudents.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All {atRiskStudents.length} At-Risk Students
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Export Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Export Analytics Data</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        {showExportOptions && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleExportData("csv")}
                className="justify-start"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportData("pdf")}
                className="justify-start"
              >
                <PieChart className="w-4 h-4 mr-2" />
                Export as PDF Report
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 