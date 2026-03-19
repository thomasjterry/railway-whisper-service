const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const OpenAI = require('openai');
const FormData = require('form-data');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/transcribe-from-url', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl is required' });
    }

    console.log('Downloading audio from:', audioUrl);
    
    // Download the audio file from the presigned URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }
    
    const audioBuffer = await audioResponse.buffer();
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    
    console.log(`Downloaded ${audioBuffer.length} bytes, type: ${contentType}`);
    
    // Determine file extension from content type
    const ext = contentType.includes('mp4') ? '.m4a' : 
                contentType.includes('wav') ? '.wav' : '.mp3';
    
    // Send to OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: `sermon${ext}`,
      contentType: contentType
    });
    formData.append('model', 'whisper-1');
    
    console.log('Sending to Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(audioBuffer, `sermon${ext}`, { type: contentType }),
      model: 'whisper-1'
    });
    
    console.log('Transcription complete');
    res.json({ transcript: transcription.text });
    
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
