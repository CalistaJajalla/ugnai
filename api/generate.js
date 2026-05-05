// api/generate.js
// UGNai API proxy using Groq
// Model: llama-3.3-70b -- Currently 2 keys

// KEY SETUP

function getKeys() {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const suffix = i === 1 ? '' : `_${i}`;
    const k = process.env[`GROQ_API_KEY${suffix}`];
    if (k) keys.push({ key: k, index: i });
  }
  return keys;
}

function getOrdered(allKeys, keyHint) {
  if (typeof keyHint === 'number' && allKeys.length > 1) {
    const start = keyHint % allKeys.length;
    return [...allKeys.slice(start), ...allKeys.slice(0, start)];
  }
  return [...allKeys].sort(() => Math.random() - 0.5);
}

// INJECTION DETECTION
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above)/gi,
  /forget\s+(everything|all|your\s+instructions?)/gi,
  /you\s+are\s+now\s+(?!a\s+formatting)/gi,
  /act\s+as\s+(?!a\s+formatting)/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /system\s*prompt/gi,
  /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
  /jailbreak/gi,
  /\bDAN\b/g,
  /process\.env/gi,
  /GROQ_API_KEY/gi,
  /<\s*script/gi,
  /\beval\s*\(/gi,
];

function detectInjection(text) {
  return INJECTION_PATTERNS.some(p => { p.lastIndex = 0; return p.test(text); });
}

function sanitize(text) {
  let clean = text;
  for (const p of INJECTION_PATTERNS) {
    clean = clean.replace(p, '[removed]');
  }
  return clean.trim();
}

// SYSTEM PROMPT BUILDER - handles language setting
function buildSystemPrompt(language) {
  const languageInstructions = {
    'English': `LANGUAGE RULE - CRITICAL:
Write ENTIRELY in English. Do not use any Filipino/Tagalog words.
The only exception: Filipino proper nouns (names of people, places) may stay as-is.
Do NOT write: "Magandang araw", "po", "Salamat", "kailangan", "walang pasok", etc.
Write: "Good day", "Thank you", "need", "no classes", etc.`,
    
    'Filipino': `LANGUAGE RULE:
Write in Filipino/Tagalog.
Technical English terms (Science, Math, quiz, seminar, project) stay in English.
Everything else in Filipino.`,
    
    'Taglish': `LANGUAGE RULE:
Write in Taglish - a natural mix of Tagalog and English as spoken in the Philippines.
Use English for technical terms, common expressions, and where it flows naturally.
Mix both languages naturally as Filipinos do in everyday conversation.`,
  };

  return `You are a formatting assistant for Filipino public school teachers.

YOUR ONLY JOB: Reformat the teacher's notes for a specific audience. Nothing else.

${languageInstructions[language] || languageInstructions['English']}

FORMATTING:
Plain text only. No markdown, no asterisks, no bold, no dashes as bullets. Blank line between paragraphs.

STUDY THESE EXAMPLES (adapt to the requested language).

FOR PARENTS (Filipino example):
Input: walang pasok friday, teacher seminar
Filipino Output: Magandang araw po! Nais kong ipaalam na walang pasok sa Biyernes dahil may seminar kaming mga guro. Babalik na po sila sa Lunes. Salamat po!
English Output: Good day! I would like to inform you that there will be no classes on Friday due to a teacher seminar. Classes will resume on Monday. Thank you!

FOR STUDENTS (Filipino example):
Input: walang pasok friday, teacher seminar
Filipino Output: Walang pasok tayo this Friday dahil may seminar kami. Babalik na tayo sa Monday.
English Output: No classes this Friday because we have a seminar. We will be back on Monday.

FOR DEPED/ADMIN:
Input: walang pasok friday, teacher seminar
Filipino Output: Nais ipaalam na ang mga klase ay suspendido sa Biyernes, [date], dahil sa nakatakdang seminar ng mga guro. Ang regular na klase ay magpapatuloy sa Lunes, [date].
English Output: This is to inform that classes are suspended on Friday, [date], due to the scheduled teacher seminar. Regular classes will resume on Monday, [date].

FOR PRINCIPAL:
Input: walang pasok friday, teacher seminar
Filipino Output: Magandang araw po. Nais ko pong ipaalam na walang klase sa aming baitang ngayong Biyernes dahil sa seminar ng mga guro. Babalik na po kami sa regular na iskedyul sa Lunes. Salamat po.
English Output: Good day. I would like to inform you that there will be no classes in our grade level this Friday due to the teacher seminar. We will resume our regular schedule on Monday. Thank you.

RULES FOR PARENTS AND STUDENTS:
Never start with overly formal openers like "Dear Parents" or "Mahal naming mga magulang".
Keep it warm but concise.
For students, go straight to the information.

CONTENT RULES:
Never add facts or details not in the teacher's notes.
Missing information gets a [fill in] or [punan] placeholder.
Output the reformatted text only. Nothing before or after it.`;
}

// Keep old constant for backwards compatibility but it's not used
const SYSTEM_PROMPT = buildSystemPrompt('Filipino');

// GROQ API CALL
async function callGroq(apiKey, userPrompt, language) {
  const systemPrompt = buildSystemPrompt(language || 'English');
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
}

// MAIN HANDLER
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, keyHint, language } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Walang laman ang input.' });
  }
  if (prompt.length < 10) {
    return res.status(400).json({ error: 'Masyadong maikli ang input.' });
  }
  if (prompt.length > 6000) {
    return res.status(400).json({ error: 'Masyadong mahaba. Hatiin sa dalawa.' });
  }

  const wasInjection = detectInjection(prompt);
  const safePrompt = wasInjection
    ? 'Wala pang notes ang guro. Sabihin sa kanila na i-paste ang kanilang notes.'
    : sanitize(prompt);

  const allKeys = getKeys();
  if (allKeys.length === 0) {
    return res.status(500).json({ error: 'Hindi pa naka-configure ang serbisyo. Makipag-ugnayan sa admin.' });
  }

  const ordered = getOrdered(allKeys, keyHint);

  for (const { key } of ordered) {
    try {
      const response = await callGroq(key, safePrompt, language);

      if (response.status === 429) {
        continue;
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error('Groq error:', response.status, errBody);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        continue;
      }

      return res.status(200).json({ text });

    } catch (_) {
      continue;
    }
  }

  return res.status(429).json({
    error: 'Sandali lang. Subukan ulit.'
  });
}
