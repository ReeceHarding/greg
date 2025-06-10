"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  AlertCircle,
  Lightbulb,
  Sparkles,
  Search,
  Calendar,
  User,
  MessageSquare,
  ChevronRight,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CheckInSubmission {
  submissionId: string
  studentId: string
  studentName: string
  studentEmail: string
  assignmentId: string
  assignmentTitle: string
  weekNumber: number
  status: string
  submittedAt?: any
  content: {
    blockers?: string | null
    insights?: string | null
    improvements?: string | null
    [key: string]: any
  }
}

interface CheckInsReviewClientProps {
  submissions: CheckInSubmission[]
}

export default function CheckInsReviewClient({ submissions }: CheckInsReviewClientProps) {
  console.log("[CheckInsReviewClient] Rendering with", submissions.length, "check-in submissions")
  
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all")
  const [activeTab, setActiveTab] = useState<"blockers" | "insights" | "improvements">("blockers")
  
  // Get unique weeks
  const weeks = useMemo(() => {
    const uniqueWeeks = [...new Set(submissions.map(s => s.weekNumber))].sort((a, b) => a - b)
    return uniqueWeeks
  }, [submissions])
  
  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.blockers?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.insights?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.improvements?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply week filter
    if (selectedWeek !== "all") {
      filtered = filtered.filter(s => s.weekNumber === selectedWeek)
    }
    
    // Sort by submission date (most recent first)
    filtered.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt.seconds * 1000) : new Date(0)
      const dateB = b.submittedAt ? new Date(b.submittedAt.seconds * 1000) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    return filtered
  }, [submissions, searchQuery, selectedWeek])
  
  // Count responses by type
  const responseCounts = useMemo(() => {
    return {
      blockers: filteredSubmissions.filter(s => s.content.blockers).length,
      insights: filteredSubmissions.filter(s => s.content.insights).length,
      improvements: filteredSubmissions.filter(s => s.content.improvements).length
    }
  }, [filteredSubmissions])
  
  const renderCheckInCard = (submission: CheckInSubmission, type: "blockers" | "insights" | "improvements") => {
    const content = submission.content[type]
    if (!content) return null
    
    const icons = {
      blockers: <AlertCircle className="w-5 h-5 text-orange-600" />,
      insights: <Lightbulb className="w-5 h-5 text-green-600" />,
      improvements: <Sparkles className="w-5 h-5 text-blue-600" />
    }
    
    const colors = {
      blockers: "border-orange-200 bg-orange-50/50",
      insights: "border-green-200 bg-green-50/50",
      improvements: "border-blue-200 bg-blue-50/50"
    }
    
    return (
      <Card 
        key={`${submission.submissionId}-${type}`}
        className={cn("hover:shadow-md transition-all duration-200 cursor-pointer", colors[type])}
        onClick={() => router.push(`/admin/reviews/${submission.submissionId}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                  {submission.studentName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{submission.studentName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Week {submission.weekNumber}</span>
                  <span>•</span>
                  <span>
                    {submission.submittedAt 
                      ? format(new Date(submission.submittedAt.seconds * 1000), "MMM d")
                      : "No date"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {icons[type]}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
            {content}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blockers Reported</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{responseCounts.blockers}</div>
            <p className="text-xs text-muted-foreground mt-1">Students facing challenges</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Insights Shared</CardTitle>
              <Lightbulb className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{responseCounts.insights}</div>
            <p className="text-xs text-muted-foreground mt-1">Learning breakthroughs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Improvements Suggested</CardTitle>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{responseCounts.improvements}</div>
            <p className="text-xs text-muted-foreground mt-1">Program feedback</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Check-in Responses</CardTitle>
              <CardDescription>Review student check-ins by category</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(selectedWeek === "all" ? weeks[weeks.length - 1] : "all")}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {selectedWeek === "all" ? "All Weeks" : `Week ${selectedWeek}`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="blockers" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Blockers ({responseCounts.blockers})
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights ({responseCounts.insights})
              </TabsTrigger>
              <TabsTrigger value="improvements" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Improvements ({responseCounts.improvements})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="blockers" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                What students are stuck on this week
              </div>
              <div className="grid gap-4">
                {filteredSubmissions.map(submission => 
                  renderCheckInCard(submission, "blockers")
                )}
                {filteredSubmissions.filter(s => s.content.blockers).length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No blockers reported</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Key learnings and breakthroughs from students
              </div>
              <div className="grid gap-4">
                {filteredSubmissions.map(submission => 
                  renderCheckInCard(submission, "insights")
                )}
                {filteredSubmissions.filter(s => s.content.insights).length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No insights shared</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="improvements" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Student suggestions for improving the program
              </div>
              <div className="grid gap-4">
                {filteredSubmissions.map(submission => 
                  renderCheckInCard(submission, "improvements")
                )}
                {filteredSubmissions.filter(s => s.content.improvements).length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No improvements suggested</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 