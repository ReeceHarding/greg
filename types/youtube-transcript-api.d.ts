declare module 'youtube-transcript-api' {
  export interface TranscriptItem {
    text: string
    start: number
    duration: number
  }
  
  export function getTranscript(videoId: string): Promise<TranscriptItem[]>
} 