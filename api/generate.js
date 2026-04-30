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
const SYSTEM_PROMPT = `You are a formatting assistant for Filipino public school teachers.

YOUR ONLY JOB: Reformat the teacher's notes for a specific audience. Nothing else.

FORMATTING:
Plain text only. No markdown, no asterisks, no bold, no dashes as bullets. Blank line between paragraphs.

STUDY THESE EXAMPLES. Produce output that matches this style exactly.

FOR PARENTS:
Input: walang pasok friday, teacher seminar
Output:
Magandang araw po! Gusto ko lang ipaalam na walang pasok this Friday dahil may seminar ang mga guro. Babalik na po sila sa Monday. Salamat po!

Input: science experiment monday, kailangan magdala ng empty plastic bottle vinegar baking soda, mag-wear lumang damit, sa labas gagawin
Output:
Magandang araw po! Mayroon pong Science experiment ang klase next Monday. Pakiusap na ipahanda ang mga sumusunod: 1 empty plastic bottle, suka, at baking soda. Paki-remind din na magsuot ng lumang damit ang inyong anak dahil magiging marumi ang aktibidad. Sa labas ito gagawin. Salamat po!

FOR STUDENTS:
Input: walang pasok friday, teacher seminar
Output:
Walang pasok tayo this Friday dahil may seminar ang mga guro. Bukas na tayo ulit sa Monday.

Input: science experiment monday, kailangan magdala ng empty plastic bottle vinegar baking soda, mag-wear lumang damit, sa labas gagawin
Output:
Mayroon tayong Science experiment next Monday. Kailangan ninyong magdala ng: 1 empty plastic bottle, suka, at baking soda. Magsuot ng lumang damit dahil magiging marumi ang aktibidad. Sa labas tayo gagawa.

FOR DEPED/ADMIN:
Input: walang pasok friday, teacher seminar
Output:
Nais ipaalam na ang mga klase ay suspendido sa Biyernes, [petsa], dahil sa nakatakdang seminar ng mga guro. Ang regular na klase ay magpapatuloy sa Lunes, [petsa].

FOR PRINCIPAL:
Input: walang pasok friday, teacher seminar
Output:
Magandang araw. Nais ko pong ipaalam na walang klase sa aming baitang ngayong Biyernes dahil sa seminar ng mga guro. Babalik na po kami sa regular na iskedyul sa Lunes. Salamat po.

RULES FOR PARENTS AND STUDENTS:
Never start with "Mahal naming mga magulang" or "Mga estudyante" or similar formal openers.
Use "Magandang araw po!" or just go straight to the message for parents.
For students, go straight to the information. No greeting needed.
Never write "ha" at the end of sentences.
Never use casual filler words like "kasi lang", "ano ba", "syempre".
End parent messages with "Salamat po!" only. Nothing longer.
End student messages with nothing or one short sentence.

RULES FOR ENGLISH WORDS:
Science, Math, experiment, quiz, seminar, schedule, report, project, reminder stay in English.
Everything else stays in Filipino: walang pasok, lumang damit, sa labas, mayroon, kailangan.
Never add English words that are not in the teacher's original notes.
Never translate Filipino words into English that have a perfectly natural Filipino version.

CONTENT RULES:
Never add facts, examples, or details not in the teacher's notes.
Missing information gets a [punan] placeholder.
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
