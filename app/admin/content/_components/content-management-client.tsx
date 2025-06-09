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
import { Search, Video, Eye, Clock, Calendar, ExternalLink, Trash2, Edit, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface SerializedVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  publishedAt: string
  channelId: string
  channelTitle: string
  transcript: string
  tags: string[]
  viewCount: number
  importedAt: string
  lastUpdatedAt: string
  hasTranscript?: boolean
}

interface ContentManagementClientProps {
  initialVideos: SerializedVideo[]
}

const ITEMS_PER_PAGE = 10

export default function ContentManagementClient({ 
  initialVideos 
}: ContentManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "views" | "title">("date")
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()
  
  console.log("[ContentManagementClient] Rendering with", initialVideos.length, "videos")
  
  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let filtered = initialVideos
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "date":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case "views":
          return (b.viewCount || 0) - (a.viewCount || 0)
        default:
          return 0
      }
    })
    
    return filtered
  }, [initialVideos, searchQuery, sortBy])
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex)
  
  // Reset to first page when filter changes
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalViews = initialVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0)
    const withTranscripts = initialVideos.filter(v => v.hasTranscript).length
    
    return {
      totalVideos: initialVideos.length,
      totalViews,
      withTranscripts,
      avgViews: Math.round(totalViews / initialVideos.length) || 0
    }
  }, [initialVideos])
  
  const handleImportVideos = () => {
    console.log("[ContentManagementClient] Import videos clicked")
    toast({
      title: "Import Started",
      description: "Importing videos from YouTube channel..."
    })
    // TODO: Implement actual import functionality
  }
  
  const formatDuration = (duration: number) => {
    if (!duration) return "N/A"
    
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">With Transcripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withTranscripts}</div>
            <p className="text-sm text-muted-foreground">
              {Math.round((stats.withTranscripts / stats.totalVideos) * 100)}% processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Avg Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Video Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>Manage all course videos and materials</CardDescription>
            </div>
            <Button onClick={handleImportVideos} className="gap-2">
              <Upload className="h-4 w-4" />
              Import Videos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest First</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Videos Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVideos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No videos found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVideos.map((video) => (
                    <TableRow key={video.videoId}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {video.thumbnailUrl && (
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              className="w-24 h-14 object-cover rounded"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate pr-2" title={video.title}>
                              {video.title}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Video className="h-3 w-3" />
                              {video.channelTitle}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(video.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {video.viewCount?.toLocaleString() || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(video.publishedAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.hasTranscript ? (
                          <Badge variant="secondary" className="text-xs">
                            Has Transcript
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No Transcript
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/videos/${video.videoId}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("[ContentManagementClient] Edit video:", video.videoId)
                              toast({
                                title: "Edit Video",
                                description: "Video editing will be implemented soon"
                              })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("[ContentManagementClient] Delete video:", video.videoId)
                              toast({
                                variant: "destructive",
                                title: "Delete Video",
                                description: "Video deletion will be implemented soon"
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} - {Math.min(endIndex, filteredVideos.length)} of {filteredVideos.length} videos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 