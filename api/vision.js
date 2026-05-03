// api/vision.js
// Handles camera OCR using Groq Vision (llama-4-scout)
// Accepts base64 image, returns extracted text

function getKey() {
  const keys = [];
  for (let i = 1; i <= 2; i++) {
    const suffix = i === 1 ? '' : `_${i}`;
    const k = process.env[`GROQ_API_KEY${suffix}`];
    if (k) keys.push(k);
  }
  return keys[Math.floor(Math.random() * keys.length)] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    return res.status(400).json({ error: 'Missing image data.' });
  }

  const key = getKey();
  if (!key) {
    return res.status(500).json({ error: 'Service not configured.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
              {
                type: 'text',
                text: 'Extract all the text from this image exactly as written. This is a Filipino teacher\'s handwritten or printed lesson notes (possible blackboard notes too). Return only the extracted text, nothing else. Preserve line breaks and structure as much as possible.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Groq Vision error:', response.status, err);
      return res.status(502).json({ error: 'Hindi nabasa ang larawan. Subukan ulit.' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'Walang nakuhang text mula sa larawan.' });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Vision handler error:', err);
    return res.status(500).json({ error: 'May problema. Subukan ulit.' });
  }
}
