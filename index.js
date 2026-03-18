import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHUNK_SIZE = 24 * 1024 * 1024; // 24MB

async function transcribeChunk(buffer, filename) {
  const formData = new FormData();
  formData.append('file', buffer, filename);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  return res.text();
}

async function splitAndTranscribe(buffer) {
  const chunks = [];
  for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
    chunks.push(buffer.subarray(offset, Math.min(offset + CHUNK_SIZE, buffer.length)));
  }

  console.log(`Transcribing ${chunks.length} chunks...`);
  const transcripts = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
    const text = await transcribeChunk(chunks[i], `chunk-${i + 1}.mp3`);
    transcripts.push(text);
  }

  return transcripts.join(' ');
}

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`Received ${req.file.size} bytes`);
    
    let transcript;
    if (req.file.size <= CHUNK_SIZE) {
      console.log('Single chunk transcription');
      transcript = await transcribeChunk(req.file.buffer, req.file.originalname);
    } else {
      console.log('Multi-chunk transcription');
      transcript = await splitAndTranscribe(req.file.buffer);
    }

    res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Railway Whisper service running on port ${PORT}`);
});
