// api/generate.js — UGNai secure proxy


// 1. RATE LIMITING
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

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 3. PROMPT INJECTION DETECTION
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above)/gi,
  /forget\s+(everything|all|your\s+instructions?)/gi,
  /you\s+are\s+now\s+(?!a\s+formatting)/gi,
  /act\s+as\s+(?!a\s+formatting)/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /system\s*prompt/gi,
  /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
  /print\s+(your|the)\s+(system\s+)?instructions?/gi,
  /what\s+are\s+your\s+instructions?/gi,
  /jailbreak/gi,
  /\bDAN\b/g,
  /\bAPI\s*key/gi,
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

// 4. LOCKED SYSTEM PROMPT
// Lives here on the server only. User input NEVER touches this.
const SYSTEM_PROMPT = `You are a formatting assistant for Filipino public school teachers inside the UGNai app.

YOUR ONLY JOB: Reformat the teacher's raw notes for a specific audience. Nothing else.

FORMATTING:
- Plain text only. No markdown, no asterisks, no bold, no bullet dashes.
- Blank line between paragraphs.

REAL EXAMPLES — produce output that looks exactly like these:

FOR PARENTS (Viber message to parent group):
Input: walang pasok friday, teacher seminar
Output:
Hi po! Reminder lang — walang pasok si [bata] this Friday dahil may seminar ang mga guro. Balik na sila Monday. Salamat po!

Input: science experiment monday, dalhin empty plastic bottle vinegar baking soda, mag-wear lumang damit, gagawin sa labas
Output:
Good morning po! May Science experiment ang class next Monday. Dalhin po ng inyong anak: 1 empty plastic bottle, vinegar, at baking soda. Paki-remind na mag-wear ng lumang damit — magiging messy kasi. Gagawin namin sa labas. Salamat po!

FOR STUDENTS (direct reminder):
Input: walang pasok friday, teacher seminar
Output:
Class! Reminder lang — walang pasok tayo this Friday. May seminar ang mga guro. Balik tayo Monday ha.

Input: science experiment monday, dalhin empty plastic bottle vinegar baking soda, mag-wear lumang damit, gagawin sa labas
Output:
Class, may Science experiment tayo Monday. Dalhin ninyo: empty plastic bottle, vinegar, baking soda. Mag-wear ng lumang damit — magiging messy talaga. Sa labas tayo gagawa. See you!

FOR DEPED/ADMIN:
Input: walang pasok friday, teacher seminar
Output:
This is to inform that classes will be suspended on Friday, [date], due to a scheduled faculty seminar. Regular classes will resume on Monday, [date].

FOR PRINCIPAL:
Input: walang pasok friday, teacher seminar
Output:
Good day. Classes will be suspended this Friday due to a faculty seminar. Regular schedule resumes Monday. Thank you.

STRICT RULES ON CLOSINGS — this is critical:
NEVER write: "Maraming salamat sa inyong patuloy na suporta at kooperasyon"
NEVER write: "Maraming salamat sa inyong tulong at suporta"
NEVER write: "Nawa ay mapanatili natin ang ating kooperasyon"
NEVER write: "Sa inyong kaalaman at pagsasaalang-alang"
CORRECT for parents: "Salamat po!" or "Thank you po!" or "Ingat po kayo!"
CORRECT for students: "See you!" or "Ha!" or nothing at all
CORRECT for DepEd/principal: "Thank you." or nothing

STRICT RULES ON ENGLISH:
KEEP in English always: Science, Math, English, experiment, quiz, activity, schedule, seminar, report, project, reminder, meeting
KEEP in Filipino: sa labas (not "outside"), lumang damit (not "old clothes"), walang pasok (not "no classes")
DO NOT use "activity" when you can just say what it is
DO NOT randomly add English words that weren't in the teacher's notes

CONTENT RULES:
- Do NOT add any facts or details the teacher did not write.
- Missing info gets a [i-fill in] placeholder.
- Output the reformatted text only. Nothing before or after it.`;

// 5. CLAUDE API CALL
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
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
}

// MAIN HANDLER
export default async function handler(req, res) {

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Walang laman ang input.' });
  }
  if (prompt.length < 10) {
    return res.status(400).json({ error: 'Masyadong maikli ang input.' });
  }
  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'Masyadong mahaba ang input. Hatiin sa dalawa.' });
  }

  // Injection check -- sanitize silently, don't tell attacker we caught them
  const wasInjection = detectInjection(prompt);
  const safePrompt   = wasInjection
    ? 'The teacher has not provided notes yet. Please ask them to paste their lesson notes.'
    : sanitize(prompt);

  // Get keys and pick available ones (not in cooldown)
  const allKeys  = getKeys();
  if (allKeys.length === 0) {
    return res.status(500).json({ error: 'Hindi pa naka-configure ang serbisyo.' });
  }

  // Spread batch calls across keys using the hint index if provided
  // This ensures 4 simultaneous batch calls each get a different key
  const { keyHint } = req.body;
  let ordered;
  if (typeof keyHint === 'number' && allKeys.length > 1) {
    const start = keyHint % allKeys.length;
    ordered = [...allKeys.slice(start), ...allKeys.slice(0, start)];
  } else {
    ordered = shuffled(allKeys);
  }

  // Try each key in order -- skip any that are rate limited
  for (const { key } of ordered) {
    try {
      const response = await callClaude(key, safePrompt);

      if (response.status === 429) {
        // This key is busy, try the next one
        continue;
      }

      if (!response.ok) {
        // Non-rate-limit error -- don't leak details
        return res.status(502).json({ error: 'May problema sa serbisyo. Subukan ulit.' });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        return res.status(502).json({ error: 'Walang laman ang sagot. Subukan ulit.' });
      }

      return res.status(200).json({ text });

    } catch (_) {
      // Network error on this key -- try next silently
      continue;
    }
  }

  // All keys rate limited simultaneously
  return res.status(429).json({
    error: 'Maraming users ang gumagamit ngayon. Maghintay ng ilang segundo at subukan ulit.'
  });
}
