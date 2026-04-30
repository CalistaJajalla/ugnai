// api/generate.js
// UGNai secure API proxy
// Handles: input validation, injection detection, key rotation, locked system prompt

// KEY ROTATION
function getKeys() {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`ANTHROPIC_KEY_${i}`];
    if (k && k.startsWith('sk-ant-')) keys.push({ key: k, index: i });
  }
  if (keys.length === 0 && process.env.ANTHROPIC_API_KEY) {
    keys.push({ key: process.env.ANTHROPIC_API_KEY, index: 0 });
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
  /ANTHROPIC_KEY/gi,
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

// SYSTEM PROMPT
const SYSTEM_PROMPT = `You are a formatting assistant for Filipino public school teachers inside the UGNai app.

YOUR ONLY JOB: Reformat the teacher's raw notes for a specific audience. Nothing else.

FORMATTING:
Plain text only. No markdown, no asterisks, no bold, no bullet dashes. Blank line between paragraphs.

REAL EXAMPLES of correct output:

FOR PARENTS (Viber group message):
Input: walang pasok friday, teacher seminar
Output:
Hi po! Reminder lang na walang pasok this Friday dahil may seminar ang mga guro. Balik na sila Monday. Salamat po!

Input: science experiment monday, dalhin empty plastic bottle vinegar baking soda, mag-wear lumang damit, gagawin sa labas
Output:
Good morning po! May Science experiment ang class next Monday. Kailangan magdala ng: 1 empty plastic bottle, vinegar, at baking soda. Paki-remind na mag-wear ng lumang damit kasi magiging messy. Sa labas gagawin. Salamat po!

FOR STUDENTS (direct class reminder):
Input: walang pasok friday, teacher seminar
Output:
Class! Walang pasok tayo this Friday. May seminar ang mga guro. Balik tayo sa Monday.

Input: science experiment monday, dalhin empty plastic bottle vinegar baking soda, mag-wear lumang damit, gagawin sa labas
Output:
Class, may Science experiment tayo sa Monday. Magdala ng empty plastic bottle, vinegar, baking soda. Mag-suot ng lumang damit para di madumihan ang uniporme. Sa labas tayo gagawa. See you!

FOR DEPED/ADMIN:
Input: walang pasok friday, teacher seminar
Output:
This is to inform that classes will be suspended on Friday, [date], due to a scheduled faculty seminar. Regular classes will resume on Monday, [date].

FOR PRINCIPAL:
Input: walang pasok friday, teacher seminar
Output:
Good day. Classes will be suspended this Friday due to a faculty seminar. Regular schedule resumes Monday. Thank you.

CLOSING RULES:
Never write: "Maraming salamat sa inyong patuloy na suporta at kooperasyon" or any variation.
Parents: end with "Salamat po!" or "Thank you po!" only.
Students: end with "See you!" or nothing.
DepEd and principal: end with "Thank you." or nothing.

ENGLISH RULES:
Keep in English: Science, Math, experiment, quiz, seminar, schedule, report, project, reminder.
Keep in Filipino: sa labas, lumang damit, walang pasok, mayroon, kailangan.
Never add English words not in the teacher's notes.

CONTENT RULES:
Do not add any facts or details the teacher did not write.
Missing info gets a [i-fill in] placeholder.
Output the reformatted text only. Nothing before or after it.`;

// CLAUDE API CALL
async function callClaude(apiKey, userPrompt) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
}

// MAIN HANDLER
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, keyHint } = req.body;

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
    return res.status(500).json({ error: 'Hindi pa naka-configure ang serbisyo.' });
  }

  const ordered = getOrdered(allKeys, keyHint);

  for (const { key } of ordered) {
    try {
      const response = await callClaude(key, safePrompt);

      if (response.status === 429) {
        continue;
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error('Anthropic error:', response.status, errBody);
        return res.status(502).json({ error: 'May problema sa serbisyo. Subukan ulit.' });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        return res.status(502).json({ error: 'Walang laman ang sagot. Subukan ulit.' });
      }

      return res.status(200).json({ text });

    } catch (_) {
      continue;
    }
  }

  return res.status(429).json({
    error: 'Busy ngayon ang serbisyo. Sandali lang at subukan ulit.'
  });
}
