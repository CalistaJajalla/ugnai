// api/math.js
// Math mode: reads equation from image or text, returns LaTeX + explanation
// Uses Groq Vision for image input, Groq text for explanation generation

function getKeys() {
  const keys = [];
  for (let i = 1; i <= 3; i++) {
    const suffix = i === 1 ? '' : `_${i}`;
    const k = process.env[`GROQ_API_KEY${suffix}`];
    if (k) keys.push(k);
  }
  return keys;
}

function pickKey(keys) {
  return keys[Math.floor(Math.random() * keys.length)];
}

// Step 1: Extract LaTeX from image using Groq Vision
async function extractMathFromImage(apiKey, base64Image, mimeType) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
          {
            type: 'text',
            text: `Extract all mathematical equations or expressions from this image. 
Return them as LaTeX notation only.
If there are multiple equations, put each on its own line.
Do not include any explanation or text — only the LaTeX.
Example output format:
x^2 + 3x - 4 = 0
\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error('Hindi nabasa ang equation sa larawan.');
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// Step 2: Extract LaTeX from plain text input
async function extractMathFromText(apiKey, text) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Convert this math expression to proper LaTeX notation. Return only the LaTeX, nothing else.
Input: ${text}`,
      }],
    }),
  });

  if (!response.ok) throw new Error('Hindi na-convert ang equation.');
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

// Step 3: Generate explanation or word problem
async function generateMathContent(apiKey, latex, audience, language, mode) {
  const audienceMap = {
    parents:   'parents of Filipino elementary or high school students',
    students:  'Filipino students in the grade level this equation is from',
    deped:     'DepEd curriculum documentation',
    principal: 'school principal reviewing lesson content',
  };

  const modePrompt = mode === 'word_problem'
    ? `Create one realistic word problem in the Philippine context that uses this equation. Make it relatable to Filipino students (e.g. use local names, places, everyday Filipino situations like sari-sari store, jeepney fare, etc.).`
    : `Write a clear, simple explanation of what this equation means and how to solve it.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are helping a Filipino public school teacher.

Equation (LaTeX): ${latex}
Audience: ${audienceMap[audience] || 'students'}
Language: ${language}
Task: ${modePrompt}

Output plain text only. No markdown, no asterisks, no LaTeX in the output text.
Write naturally in ${language}.`,
      }],
    }),
  });

  if (!response.ok) throw new Error('Hindi nagawa ang explanation.');
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType, text, audience, language, mode } = req.body;

  if (!image && !text) {
    return res.status(400).json({ error: 'Kailangan ng larawan o text ng equation.' });
  }

  const keys = getKeys();
  if (!keys.length) {
    return res.status(500).json({ error: 'Hindi pa naka-configure ang serbisyo.' });
  }

  try {
    const key = pickKey(keys);

    // Step 1: Get LaTeX from image or text
    let latex;
    if (image) {
      latex = await extractMathFromImage(key, image, mimeType || 'image/jpeg');
    } else {
      latex = await extractMathFromText(key, text);
    }

    if (!latex) {
      return res.status(422).json({ error: 'Walang nahanap na equation. Subukan ulit.' });
    }

    // Step 2: Generate explanation or word problem
    const content = await generateMathContent(
      pickKey(keys),
      latex,
      audience || 'students',
      language || 'Filipino',
      mode || 'explanation'
    );

    return res.status(200).json({ latex, content });

  } catch (err) {
    console.error('Math handler error:', err);
    return res.status(500).json({ error: err.message || 'May problema. Subukan ulit.' });
  }
}
