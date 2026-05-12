// ElevenLabs Text-to-Speech API
// Converts text to natural-sounding speech

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for both possible env var names (ELEVEN_API_KEY or ELEVENLABS_API_KEY)
  const apiKey = process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    // Return 503 so frontend knows to use browser TTS fallback
    return res.status(503).json({ error: 'ElevenLabs not configured - set ELEVEN_API_KEY env var' });
  }

  const { text, language } = req.body;

  if (!text || text.length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Limit text length to avoid high API costs
  const maxChars = 2000;
  const truncatedText = text.slice(0, maxChars);

  // Default ElevenLabs voices (work on FREE tier)
  // Library/community voices like Amaya require paid plan
  const RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - clear, warm female voice
  
  const voices = {
    english: {
      voiceId: RACHEL_VOICE_ID,
      model: 'eleven_multilingual_v2',
    },
    filipino: {
      voiceId: RACHEL_VOICE_ID,
      model: 'eleven_multilingual_v2',
    },
    taglish: {
      voiceId: RACHEL_VOICE_ID,
      model: 'eleven_multilingual_v2',
    },
  };

  // Default to Filipino/multilingual if language not specified
  const lang = (language || 'filipino').toLowerCase();
  const voiceConfig = voices[lang] || voices.filipino;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: voiceConfig.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('ElevenLabs error:', error);
      
      if (response.status === 401) {
        return res.status(503).json({ error: 'Invalid API key' });
      }
      if (response.status === 429) {
        return res.status(503).json({ error: 'Rate limit exceeded' });
      }
      
      return res.status(503).json({ error: 'TTS service unavailable' });
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Return as base64 for easy frontend handling
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return res.status(200).json({ audioUrl });

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(503).json({ error: 'TTS service error' });
  }
}
