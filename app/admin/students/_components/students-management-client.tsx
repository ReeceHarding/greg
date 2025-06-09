"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Search, Filter, Mail, Calendar, Activity, Award } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface SerializedProfile {
  id: string
  userId: string
  email: string
  displayName?: string
  photoURL?: string
  bio?: string
  role: "student" | "admin"
  skills?: string[]
  interests?: string[]
  createdAt: string
  lastActiveAt?: string
  onboardingCompleted?: boolean
  weeklyProgress?: Record<string, any>
}

interface StudentsManagementClientProps {
  initialProfiles: SerializedProfile[]
}

export default function StudentsManagementClient({ 
  initialProfiles 
}: StudentsManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "student" | "admin">("student")
  const [sortBy, setSortBy] = useState<"name" | "date" | "activity">("name")
  
  console.log("[StudentsManagementClient] Rendering with", initialProfiles.length, "profiles")
  
  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let filtered = initialProfiles
    
    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter(profile => profile.role === filterRole)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(profile => 
        profile.displayName?.toLowerCase().includes(query) ||
        profile.email.toLowerCase().includes(query)
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.displayName || a.email).localeCompare(b.displayName || b.email)
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "activity":
          return new Date(b.lastActiveAt || b.createdAt).getTime() - 
                 new Date(a.lastActiveAt || a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    return filtered
  }, [initialProfiles, filterRole, searchQuery, sortBy])
  
  // Calculate stats
  const stats = useMemo(() => {
    const students = initialProfiles.filter(p => p.role === "student")
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const activeStudents = students.filter(s => 
      new Date(s.lastActiveAt || s.createdAt) > oneWeekAgo
    )
    
    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      completedOnboarding: students.filter(s => s.onboardingCompleted).length,
      avgProgress: 0 // TODO: Calculate from weeklyProgress
    }
  }, [initialProfiles])
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Active This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.activeStudents}</div>
            <p className="text-sm text-muted-foreground">
              {Math.round((stats.activeStudents / stats.totalStudents) * 100)}% engagement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Onboarding Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOnboarding}</div>
            <p className="text-sm text-muted-foreground">
              {Math.round((stats.completedOnboarding / stats.totalStudents) * 100)}% completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <p className="text-sm text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>Search and manage all registered students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Join Date</SelectItem>
                <SelectItem value="activity">Last Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Students Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {profile.photoURL ? (
                            <img 
                              src={profile.photoURL} 
                              alt={profile.displayName || profile.email}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {(profile.displayName || profile.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {profile.displayName || profile.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {profile.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                          {profile.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(profile.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {profile.lastActiveAt ? (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-accent" />
                            {format(new Date(profile.lastActiveAt), "MMM d")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: "0%" }} // TODO: Calculate from weeklyProgress
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">0%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/students/${profile.userId}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={`mailto:${profile.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 