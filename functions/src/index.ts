/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase Admin
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Daily check for new YouTube videos
// Runs every day at 2 AM UTC
export const checkForNewYouTubeVideos = onSchedule({
  schedule: "0 2 * * *", // Daily at 2 AM UTC
  timeZone: "UTC",
  retryCount: 3,
}, async (event) => {
  logger.info("Starting daily YouTube video check", { timestamp: event.scheduleTime });
  
  const db = admin.firestore();
  const YOUTUBE_API_KEY = functions.config().youtube?.api_key || process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = "UCPjNBjflYl0-HQtUvOx0Ibw"; // Greg Isenberg's channel
  
  if (!YOUTUBE_API_KEY) {
    logger.error("YouTube API key not configured");
    throw new Error("YouTube API key not configured");
  }
  
  try {
    // Get the latest video from our database
    const videosSnapshot = await db.collection("videos")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();
    
    const latestStoredDate = videosSnapshot.empty 
      ? new Date(0) 
      : videosSnapshot.docs[0].data().publishedAt.toDate();
    
    // Fetch latest videos from YouTube
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${YOUTUBE_API_KEY}&` +
      `channelId=${CHANNEL_ID}&` +
      `part=snippet&` +
      `order=date&` +
      `type=video&` +
      `maxResults=10`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    let newVideosCount = 0;
    
    // Process new videos
    for (const item of data.items) {
      const publishedAt = new Date(item.snippet.publishedAt);
      
      if (publishedAt > latestStoredDate) {
        // Fetch full video details
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
          `key=${YOUTUBE_API_KEY}&` +
          `id=${item.id.videoId}&` +
          `part=snippet,contentDetails,statistics`
        );
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          const videoDetails = detailsData.items[0];
          
          // Parse duration
          const duration = parseDuration(videoDetails.contentDetails.duration);
          
          // Store in Firestore
          await db.collection("videos").doc(item.id.videoId).set({
            videoId: item.id.videoId,
            title: videoDetails.snippet.title,
            description: videoDetails.snippet.description,
            thumbnailUrl: videoDetails.snippet.thumbnails.high.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            duration: duration,
            publishedAt: admin.firestore.Timestamp.fromDate(publishedAt),
            channelId: videoDetails.snippet.channelId,
            channelTitle: videoDetails.snippet.channelTitle,
            transcript: "",
            transcriptChunks: [],
            tags: videoDetails.snippet.tags || [],
            viewCount: parseInt(videoDetails.statistics.viewCount || "0"),
            importedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          newVideosCount++;
          logger.info(`Added new video: ${videoDetails.snippet.title}`);
        }
      }
    }
    
    logger.info("YouTube video check completed", {
      newVideos: newVideosCount,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    logger.error("Error in YouTube video check function", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    throw error; // Re-throw to trigger retry
  }
});

// Helper function to parse YouTube duration format (PT1H23M45S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  return hours * 3600 + minutes * 60 + seconds;
}
