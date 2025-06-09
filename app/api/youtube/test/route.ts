import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[YouTube Test API] Testing YouTube API setup...")
  
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  const CHANNEL_ID = "UCPjNBjflYl0-HQtUvOx0Ibw" // Greg Isenberg's channel
  
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({
      success: false,
      message: "YouTube API key not configured",
      hasKey: false
    }, { status: 500 })
  }
  
  try {
    // Test 1: Get channel info
    console.log("[YouTube Test API] Testing channel info endpoint...")
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    )
    
    if (!channelResponse.ok) {
      const error = await channelResponse.text()
      console.error("[YouTube Test API] Channel request failed:", channelResponse.status, error)
      return NextResponse.json({
        success: false,
        message: "Failed to fetch channel info",
        status: channelResponse.status,
        error: error
      }, { status: 500 })
    }
    
    const channelData = await channelResponse.json()
    console.log("[YouTube Test API] Channel data:", JSON.stringify(channelData, null, 2))
    
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No channel found"
      }, { status: 404 })
    }
    
    const channel = channelData.items[0]
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads
    
    // Test 2: Get first few videos
    console.log("[YouTube Test API] Testing playlist items endpoint...")
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${YOUTUBE_API_KEY}`
    )
    
    if (!videosResponse.ok) {
      const error = await videosResponse.text()
      console.error("[YouTube Test API] Videos request failed:", videosResponse.status, error)
      return NextResponse.json({
        success: false,
        message: "Failed to fetch videos",
        status: videosResponse.status,
        error: error
      }, { status: 500 })
    }
    
    const videosData = await videosResponse.json()
    console.log("[YouTube Test API] Videos data:", JSON.stringify(videosData, null, 2))
    
    return NextResponse.json({
      success: true,
      message: "YouTube API is working correctly",
      data: {
        channelTitle: channel.snippet.title,
        channelId: channel.id,
        uploadsPlaylistId: uploadsPlaylistId,
        totalVideos: videosData.pageInfo.totalResults,
        sampleVideos: videosData.items.map((item: any) => ({
          title: item.snippet.title,
          videoId: item.snippet.resourceId.videoId,
          publishedAt: item.snippet.publishedAt
        }))
      }
    })
    
  } catch (error) {
    console.error("[YouTube Test API] Unexpected error:", error)
    return NextResponse.json({
      success: false,
      message: "Unexpected error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 