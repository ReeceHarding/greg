# Firebase Cloud Functions

This directory contains Cloud Functions for the AI Summer Camp platform.

## Functions

### checkForNewYouTubeVideos
- **Schedule**: Daily at 2 AM UTC
- **Purpose**: Automatically checks Greg Isenberg's YouTube channel for new videos and imports them into Firestore
- **Configuration**: Requires YouTube API key

## Setup

1. **Set the YouTube API key in Firebase Functions config**:
   ```bash
   firebase functions:config:set youtube.api_key="YOUR_YOUTUBE_API_KEY"
   ```

2. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

3. **Build the functions**:
   ```bash
   npm run build
   ```

## Deployment

To deploy all functions:
```bash
firebase deploy --only functions
```

To deploy a specific function:
```bash
firebase deploy --only functions:checkForNewYouTubeVideos
```

## Testing Locally

1. **Set up emulators**:
   ```bash
   firebase emulators:start --only functions,firestore
   ```

2. **Trigger the scheduled function manually** (in another terminal):
   ```bash
   firebase functions:shell
   # Then in the shell:
   checkForNewYouTubeVideos()
   ```

## Monitoring

View function logs:
```bash
firebase functions:log
```

View specific function logs:
```bash
firebase functions:log --only checkForNewYouTubeVideos
```

## Environment Variables

The function uses the following configuration:
- `youtube.api_key`: YouTube Data API v3 key

To view current config:
```bash
firebase functions:config:get
``` 