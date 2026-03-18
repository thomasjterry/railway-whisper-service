# Railway Whisper Service

Long-running Whisper transcription service for large sermon audio files.

## Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize project:
   ```bash
   cd ~/.openclaw/workspace/railway-whisper-service
   railway init
   ```

4. Set environment variable:
   ```bash
   railway variables set OPENAI_API_KEY=your-key-here
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Get the public URL:
   ```bash
   railway domain
   ```

## API

**POST /transcribe**
- Body: `multipart/form-data` with `audio` file
- Returns: `{ "transcript": "..." }`

**GET /health**
- Returns: `{ "status": "ok", "timestamp": "..." }`

## Features

- Handles files of any size (no timeout limits)
- Auto-splits files >24MB into chunks
- Transcribes via OpenAI Whisper API
- Returns combined transcript
