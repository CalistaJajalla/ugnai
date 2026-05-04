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

// Detect complexity level of the equation to adjust prompting
function detectComplexity(latex) {
  const complex = [
    /\\frac/, /\\int/, /\\sum/, /\\prod/, /\\lim/,
    /\^{[^}]{2,}}/, // exponents with multiple chars like x^{10}
    /\\sqrt\[/, // nth roots
    /\\matrix/, /\\begin/,
    /[a-z]\^[3-9]/, // cubic and higher polynomials
    /[a-z]\^{[2-9]}/, // same with braces
  ];
  const isComplex = complex.some(r => r.test(latex));
  const hasPolynomial = /[a-z]\^[2-9]|[a-z]\^{[2-9]}/.test(latex);
  return { isComplex, hasPolynomial };
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
    parents:   'parents of Filipino elementary or high school students (use simple, non-technical language)',
    students:  'Filipino high school students learning this topic for the first time',
    deped:     'DepEd curriculum documentation (use formal academic language)',
    principal: 'school principal reviewing lesson content (brief and professional)',
  };

  const { isComplex, hasPolynomial } = detectComplexity(latex);

  // Build a much more specific prompt based on complexity and mode
  let taskPrompt;

  if (mode === 'word_problem') {
    if (hasPolynomial) {
      taskPrompt = `Create ONE realistic word problem for Filipino students that naturally leads to this polynomial equation.
Rules:
- Use a real Philippine setting (sari-sari store, jeepney, palengke, school canteen, barangay, etc.)
- Use Filipino names (e.g. Juan, Maria, Aling Nena, Kuya Ben)
- The story must logically and naturally produce this exact equation when solved
- State what the student needs to find (the unknown variable)
- Do NOT show the equation itself in the problem — let it come from the situation
- The numbers must be realistic and make sense in the story
- Keep it to 3-5 sentences maximum`;
    } else if (isComplex) {
      taskPrompt = `Create ONE realistic word problem for Filipino students that uses this equation.
Rules:
- Use a real Philippine setting and Filipino names
- The problem must make practical sense (e.g. budgeting, distance, time, splitting costs)
- State clearly what the student needs to solve for
- Do NOT write the equation directly — let it emerge from the problem naturally
- Keep it to 3-5 sentences`;
    } else {
      taskPrompt = `Create one realistic word problem in the Philippine context that uses this equation.
Use local names, places, and everyday Filipino situations (sari-sari store, jeepney fare, school canteen, etc.).
State what needs to be solved. Keep it to 3-4 sentences.`;
    }
  } else {
    // Explanation mode
    if (hasPolynomial) {
      taskPrompt = `Write a clear step-by-step explanation of this polynomial equation for the audience described.
Structure your explanation like this:
1. What type of equation this is (e.g. quadratic, cubic) and what degree it is
2. What the variable represents and what solving it means
3. The method to solve it (factoring, quadratic formula, etc.) with each step written out in plain words
4. What the solution(s) mean in plain language
Write in plain text only. No markdown, no bullet symbols, no asterisks. Use numbered steps written as sentences.`;
    } else if (isComplex) {
      taskPrompt = `Write a clear step-by-step explanation of this equation for the audience described.
Cover: what the equation is doing, what each part means, how to approach solving or using it, and what the result tells us.
Write in plain text only. No markdown, no bullet symbols, no asterisks. Use numbered steps written as sentences.`;
    } else {
      taskPrompt = `Write a clear, simple explanation of what this equation means and how to solve it, step by step.
Write in plain text only. No markdown, no bullet symbols, no asterisks.`;
    }
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a skilled Filipino math teacher helping explain math clearly to different audiences.
You always write in plain, natural ${language} — no markdown formatting, no asterisks, no bullet symbols, no LaTeX in your output.
Your explanations are accurate, logical, and easy to follow.`,
        },
        {
          role: 'user',
          content: `Equation (LaTeX): ${latex}
Audience: ${audienceMap[audience] || audienceMap.students}
Language: ${language}

Task: ${taskPrompt}`,
        },
      ],
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
    // Math mode always uses English for clarity
    const content = await generateMathContent(
      pickKey(keys),
      latex,
      audience || 'students',
      'English',
      mode || 'explanation'
    );

    return res.status(200).json({ latex, content });

  } catch (err) {
    console.error('Math handler error:', err);
    return res.status(500).json({ error: err.message || 'May problema. Subukan ulit.' });
  }
}
