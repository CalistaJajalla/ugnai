// ============================
// UGNAI - app.js
// Calls /api/generate (server-side proxy).
// ============================

const S = {
  audience: 'parents',
  format:   'letter',
  language: 'Filipino',
  tone:     'warm',
  output:   '',
  batch:    {},
};

// ONBOARDING
let obStep = 1;
function initOnboard() {
  const el = document.getElementById('onboarding');
  if (!el) return;
  if (!localStorage.getItem('ugnai_seen'))
    el.classList.remove('hidden');
}
document.getElementById('ob-next')?.addEventListener('click', () => {
  const steps = document.querySelectorAll('.ob-step');
  const dots  = document.querySelectorAll('.dot');
  steps[obStep - 1].classList.remove('active');
  dots[obStep - 1].classList.remove('on');
  obStep++;
  if (obStep > steps.length) {
    document.getElementById('onboarding').classList.add('hidden');
    localStorage.setItem('ugnai_seen', '1');
    return;
  }
  steps[obStep - 1].classList.add('active');
  dots[obStep - 1].classList.add('on');
  if (obStep === steps.length)
    document.getElementById('ob-next').textContent = 'Sige na!';
});

// WORD COUNT
const notesEl = document.getElementById('notes');
notesEl?.addEventListener('input', () => {
  const words = notesEl.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wcount').textContent = `${words} salita`;
  let msg = '';
  if (notesEl.value.length > 0 && words < 10)
    msg = `<span class="w-short">Medyo maikli pa. Dagdagan mo para mas maganda ang output.</span>`;
  else if (notesEl.value.length > 3000)
    msg = `<span class="w-long">Medyo mahaba na. Baka gusto mong hatiin sa dalawa?</span>`;
  document.getElementById('warn').innerHTML = msg;
});

// AUDIENCE
document.querySelectorAll('.aud').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.aud').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    S.audience = b.dataset.a;
    const df = { parents:'letter', students:'student-summary', deped:'deped-report', principal:'weekly' };
    setChip(df[S.audience] || 'letter');
  });
});

// FORMAT CHIPS
function setChip(f) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  const t = document.querySelector(`.chip[data-f="${f}"]`);
  if (t) { t.classList.add('on'); S.format = f; }
}
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    S.format = c.dataset.f;
  });
});

// LANGUAGE
document.querySelectorAll('#lang-pills .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#lang-pills .pill').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); S.language = b.dataset.v;
  });
});

// TONE
document.querySelectorAll('#tone-pills .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#tone-pills .pill').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); S.tone = b.dataset.v;
  });
});

// TEMPLATES
const TMPLS = {
  'parent-advisory':
`[Teacher name] Class Advisory — [Date]

Magandang araw po! Nais ko pong ipaalam sa inyo ang sumusunod:

Paksa: [Subject or topic]
Petsa ng aktibidad: [Date]
Kailangan ng bata: [What they need to bring or do]
Iba pang impormasyon: [Any other notes]

Salamat po sa inyong patuloy na suporta.`,

  'class-memo':
`MEMORANDUM

To: [Recipient]
From: [Teacher name]
Date: [Date]
Subject: [Memo subject]

[Write your memo content here. Include main points, action items, and deadlines.]

Action required by: [Date]`,

  'sf9-narrative':
`SF-9 Learner Progress Report Narrative

Pupil: [Student name]
Grade & Section: [Grade - Section]
School Year: [SY]
Quarter: [Q1/Q2/Q3/Q4]

Academic Performance:
[Describe the student's academic performance this quarter.]

Character and Values:
[Describe behavior, participation, and character traits observed.]

Areas for Improvement:
[Note areas needing attention or support from parents.]

Teacher's Recommendation:
[Write your recommendation for the student and parents.]`,

  'weekly-update':
`Week of [Date] — Class Update

What we covered this week:
- [Topic 1]
- [Topic 2]

Upcoming next week:
- [What is coming]

Reminders:
- [Reminder 1]

Assignments due:
- [Assignment] due [Date]`,

  'activity-reminder':
`Activity Reminder

Activity: [Name]
Date: [Date]
Time: [Time]
Venue: [Location]
What to bring: [List items]
What to wear: [Uniform or dress code]
Permission slip due: [Date]

Contact [teacher name] at [number] for questions.`,
};

document.getElementById('tmpl')?.addEventListener('change', e => {
  const val = e.target.value;
  if (!val || !TMPLS[val]) return;
  if (notesEl.value.trim() && !confirm('Palitan ang nakasulat mo ng template?')) {
    e.target.value = ''; return;
  }
  notesEl.value = TMPLS[val];
  notesEl.dispatchEvent(new Event('input'));
  e.target.value = '';
});

// PROMPT BUILDER
function buildPrompt(input, aud, fmt, lang, tone) {
  const audMap = {
    parents:   'parents of Filipino public school students. Tone: like a teacher texting a Viber parent group — warm, short, direct, conversational Taglish. Example opener: "Hi mga parents! Gusto lang i-remind..."',
    students:  'Filipino public school students. Tone: direct and clear, like a teacher giving a reminder to their class. Example opener: "Reminder lang na may quiz tayo this Friday..."',
    deped:     'DepEd officials or school administrators. Tone: professional but human, no bureaucratic filler. Clear subject line, short body, direct.',
    principal: 'the school principal. Tone: brief and respectful, like a hallway update turned into a short memo. Two paragraphs max.',
  };
  const fmtMap = {
    'letter':          'a letter with greeting, body paragraphs, and polite closing',
    'bulletin':        'a short bulletin — easy to scan, clear, direct',
    'deped-report':    'a formal DepEd report with subject line, body, and summary',
    'student-summary': 'a simple student-facing summary with bullet points and plain language',
    'reminder':        'a brief reminder notice with key dates and action items highlighted',
    'weekly':          'a weekly update with sections for covered topics, upcoming items, and reminders',
  };
  const toneMap = {
    warm:        'conversational and caring — like texting a friend or a parent you know well. Use "po" naturally but not excessively. Example: "Hi! Gusto lang i-remind na may quiz tayo this Friday."',
    formal:      'professional and clear — no slang, complete sentences, respectful. Like a formal memo but still readable.',
    simple:      'super easy to understand — short sentences, common words only, like explaining to a student or a parent who may not be confident in Filipino.',
    encouraging: 'positive and motivating — acknowledge effort, use affirming words. Like a teacher cheering on their students or thanking parents.',
  };

  return `You are a formatting assistant for Filipino public school teachers. Your ONLY job is to reformat the teacher's notes for a specific audience.

STRICT RULES:
- Do NOT add any facts, figures, examples, or content the teacher did not provide.
- Do NOT invent any detail. If something is missing, write [placeholder in brackets].
- Do NOT change the meaning of anything the teacher wrote.
- Only adjust language, tone, and format.
- Output plain text only — no asterisks, no bold, no markdown headers.

Audience: ${audMap[aud] || aud}
Format: ${fmtMap[fmt] || fmt}
Output language: ${lang}${lang === 'Taglish' ? ' (mix Filipino and English naturally, the way Filipino teachers actually text and talk, not forced translations)' : ''}
Tone: ${toneMap[tone] || tone}

Teacher's notes:
---
${input}
---

Output the reformatted draft only. No explanation, no intro sentence, no meta-commentary.`;
}

// API CALL via proxy
async function callAPI(prompt, keyHint = 0) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const WAITS = [0, 1500, 2500, 4000];

  for (let attempt = 0; attempt < WAITS.length; attempt++) {
    if (WAITS[attempt] > 0) await sleep(WAITS[attempt]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, keyHint: keyHint + attempt }),
      });

      // Always retry on 429 or 5xx
      if (res.status === 429 || res.status >= 500) continue;

      if (!res.ok) {
        // 4xx errors won't get better with retry
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Error');
      }

      const d = await res.json();
      return stripMarkdown(d.text);

    } catch (err) {
      // Network error -- retry unless it's the last attempt
      if (attempt === WAITS.length - 1) throw err;
    }
  }
  throw new Error('Subukan ulit mamaya.');
}

function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** -> bold
    .replace(/\*(.+?)\*/g, '$1')        // *italic* -> italic
    .replace(/^#{1,6}\s+/gm, '')        // ### headers
    .replace(/^[-*]\s+/gm, '• ')        // - bullet -> • bullet (readable)
    .replace(/^\d+\.\s+/gm, '')         // 1. numbered list markers
    .trim();
}

// GENERATE SINGLE
async function genSingle() {
  const input = notesEl.value.trim();
  if (!input) { alert('Isulat mo muna ang tala mo.'); return; }

  const btn = document.getElementById('gen-btn');
  const lbl = document.getElementById('gen-lbl');
  const spn = document.getElementById('gen-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.remove('hidden');
  document.getElementById('batch-out').classList.add('hidden');
  document.getElementById('out-text').innerHTML =
    '<div class="out-empty" style="font-style:normal;color:var(--ink3)">Hinihintay ang output...</div>';

  try {
    const result = await callAPI(buildPrompt(input, S.audience, S.format, S.language, S.tone));
    S.output = result;
    document.getElementById('out-text').textContent = result;
    saveHist({ input, output: result, audience: S.audience, format: S.format, language: S.language, tone: S.tone });
  } catch (err) {
    document.getElementById('out-text').textContent = 'May problema. Subukan ulit mamaya.';
  } finally {
    btn.disabled = false; lbl.classList.remove('hidden'); spn.classList.add('hidden');
  }
}
document.getElementById('gen-btn')?.addEventListener('click', genSingle);
document.getElementById('regen-btn')?.addEventListener('click', genSingle);

// BATCH GENERATE
async function genBatch() {
  const input = notesEl.value.trim();
  if (!input) { alert('Isulat mo muna ang tala mo.'); return; }

  const btn = document.getElementById('batch-btn');
  const lbl = document.getElementById('batch-lbl');
  const spn = document.getElementById('batch-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.add('hidden');
  document.getElementById('batch-out').classList.remove('hidden');

  const auds = ['parents','students','deped','principal'];
  const fmts = { parents:'letter', students:'student-summary', deped:'deped-report', principal:'weekly' };
  auds.forEach(a => { document.getElementById(`b-${a}`).textContent = 'Ginagawa...'; });

  try {
    // Sequential with 1.2s delay between calls - avoids rate limits on free tier keys
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < auds.length; i++) {
      const a = auds[i];
      document.getElementById(`b-${a}`).textContent = 'Ginagawa...';
      try {
        const result = await callAPI(buildPrompt(input, a, fmts[a], S.language, S.tone), i);
        S.batch[a] = result;
        document.getElementById(`b-${a}`).textContent = result;
      } catch (e) {
        S.batch[a] = `Hindi nagawa: ${e.message}`;
        document.getElementById(`b-${a}`).textContent = `Hindi nagawa: ${e.message}`;
      }
      if (i < auds.length - 1) await delay(1500);
    }
    saveHist({ input, output: '[Batch] Para sa lahat generated', batchOutputs: { ...S.batch }, audience: 'batch', format: 'batch', language: S.language, tone: S.tone });
  } catch (e) {
    auds.forEach(a => { document.getElementById(`b-${a}`).textContent = `Error: ${e.message}`; });
  } finally {
    btn.disabled = false; lbl.classList.remove('hidden'); spn.classList.add('hidden');
  }
}
document.getElementById('batch-btn')?.addEventListener('click', genBatch);

// BATCH COPY
document.querySelectorAll('.bc').forEach(b => {
  b.addEventListener('click', () => {
    const txt = S.batch[b.dataset.t] || '';
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
      const orig = b.innerHTML;
      b.innerHTML = `<svg width="12" height="12"><use href="#i-check"/></svg>`;
      setTimeout(() => { b.innerHTML = orig; }, 1600);
    });
  });
});

// COPY
document.getElementById('copy-btn')?.addEventListener('click', () => {
  if (!S.output) return;
  navigator.clipboard.writeText(S.output).then(() => {
    document.getElementById('copy-lbl').textContent = 'Nakopya!';
    document.getElementById('copy-ico').innerHTML = `<use href="#i-check"/>`;
    setTimeout(() => {
      document.getElementById('copy-lbl').textContent = 'Kopyahin';
      document.getElementById('copy-ico').innerHTML = `<use href="#i-copy"/>`;
    }, 1800);
  });
});

// PDF
document.getElementById('pdf-btn')?.addEventListener('click', () => {
  if (!S.output) { alert('Wala pang output. Mag-generate muna.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const m = 22, pw = doc.internal.pageSize.getWidth() - m * 2;
  let y = m;

  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(26,23,20);
  doc.text('UGNai: Reformatted Draft', m, y); y += 8;

  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(122,114,105);
  doc.text(`Audience: ${S.audience}  |  Format: ${S.format}  |  Language: ${S.language}  |  Tone: ${S.tone}`, m, y); y += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, m, y); y += 5;
  doc.setTextColor(192,57,43); doc.text('DRAFT: Review before sending', m, y); y += 9;

  doc.setDrawColor(210,200,190); doc.line(m, y, m + pw, y); y += 8;

  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(26,23,20);
  doc.splitTextToSize(S.output, pw).forEach(line => {
    if (y > 272) { doc.addPage(); y = m; }
    doc.text(line, m, y); y += 6.5;
  });
  doc.save(`UGNai_${S.audience}_${Date.now()}.pdf`);
});

// FEEDBACK
document.querySelectorAll('.fb').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.fb').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const fb = JSON.parse(localStorage.getItem('ugnai_fb') || '[]');
    fb.push({ v: b.dataset.v, ts: Date.now(), a: S.audience });
    localStorage.setItem('ugnai_fb', JSON.stringify(fb.slice(-100)));
  });
});

// HISTORY
function saveHist(entry) {
  const h = JSON.parse(localStorage.getItem('ugnai_hist') || '[]');
  h.unshift({ ...entry, id: Date.now(), ts: new Date().toISOString() });
  localStorage.setItem('ugnai_hist', JSON.stringify(h.slice(0, 50)));
  renderHist();
}
function renderHist(filter = '') {
  const h = JSON.parse(localStorage.getItem('ugnai_hist') || '[]');
  const el = document.getElementById('hist-list');
  if (!el) return;
  const filtered = h.filter(x =>
    !filter ||
    x.output.toLowerCase().includes(filter.toLowerCase()) ||
    x.input.toLowerCase().includes(filter.toLowerCase())
  );
  if (!filtered.length) {
    el.innerHTML = '<div style="color:var(--ink4);font-size:13px;text-align:center;padding:28px">Wala pang nakaraang draft</div>';
    return;
  }
  el.innerHTML = filtered.map(x => `
    <div class="hist-item" data-id="${x.id}">
      <div class="hist-meta">${new Date(x.ts).toLocaleString()} · ${x.audience} · ${x.language}</div>
      <div class="hist-preview">${x.output.substring(0, 120)}...</div>
    </div>`).join('');
  el.querySelectorAll('.hist-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const entry = h.find(x => x.id === id);
      if (!entry) return;
      notesEl.value = entry.input;
      notesEl.dispatchEvent(new Event('input'));
      if (entry.batchOutputs) {
        Object.entries(entry.batchOutputs).forEach(([a, t]) => {
          const el2 = document.getElementById(`b-${a}`);
          if (el2) { el2.textContent = t; S.batch[a] = t; }
        });
        document.getElementById('single-out').classList.add('hidden');
        document.getElementById('batch-out').classList.remove('hidden');
      } else {
        S.output = entry.output;
        document.getElementById('out-text').textContent = entry.output;
        document.getElementById('single-out').classList.remove('hidden');
        document.getElementById('batch-out').classList.add('hidden');
      }
      document.getElementById('hist-panel').classList.add('hidden');
    });
  });
}

document.getElementById('hist-q')?.addEventListener('input', e => renderHist(e.target.value));
document.getElementById('hist-toggle')?.addEventListener('click', () => {
  document.getElementById('hist-panel').classList.toggle('hidden');
  renderHist();
});
document.getElementById('hist-close')?.addEventListener('click', () =>
  document.getElementById('hist-panel').classList.add('hidden'));
document.getElementById('hist-clear')?.addEventListener('click', () => {
  if (!confirm('Burahin lahat ng nakaraan?')) return;
  localStorage.removeItem('ugnai_hist');
  renderHist();
});

// VOICE INPUT
// Uses Web Speech API for real-time transcription
// Supports Filipino (fil-PH) and English

let recognition = null;
let isRecording = false;

function initVoice() {
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (btn) {
      btn.disabled = true;
      btn.title = 'Hindi sinusuportahan ng browser na ito ang voice input. Gamitin ang Chrome.';
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = S.language === 'English' ? 'en-PH' : 'fil-PH';

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t + ' ';
      } else {
        interim = t;
      }
    }
    const notesEl = document.getElementById('notes');
    notesEl.value = finalTranscript + interim;
    notesEl.dispatchEvent(new Event('input'));
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    stopRecording();
    if (event.error === 'not-allowed') {
      alert('Hindi binigyan ng permiso ang mikropono. I-allow ang microphone sa browser settings.');
    }
  };

  recognition.onend = () => {
    if (isRecording) stopRecording();
  };

  btn?.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

function startRecording() {
  if (!recognition) return;
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  recognition.lang = S.language === 'English' ? 'en-PH' : 'fil-PH';
  recognition.start();
  isRecording = true;
  btn?.classList.add('recording');
  if (label) label.textContent = 'Itigil';
}

function stopRecording() {
  recognition?.stop();
  isRecording = false;
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  btn?.classList.remove('recording');
  if (label) label.textContent = 'Magsalita';
}

// CAMERA OCR
// Sends photo to Groq Vision, shows extracted text for review before using

async function handleCameraCapture(file) {
  if (!file) return;

  const label = document.getElementById('camera-label');
  const btn = document.getElementById('camera-btn');

  btn.disabled = true;
  if (label) label.textContent = 'Binabasa...';

  try {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mimeType }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Hindi nabasa ang larawan.');
    }

    const data = await res.json();
    showOcrReview(data.text);

  } catch (err) {
    alert('Hindi nabasa ang larawan: ' + err.message);
  } finally {
    btn.disabled = false;
    if (label) label.textContent = 'Kumuha ng Litrato';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showOcrReview(text) {
  const review = document.getElementById('ocr-review');
  const ocrText = document.getElementById('ocr-text');
  if (!review || !ocrText) return;
  ocrText.value = text;
  review.classList.remove('hidden');
  ocrText.focus();
}

function hideOcrReview() {
  document.getElementById('ocr-review')?.classList.add('hidden');
}

function initCamera() {
  const cameraBtn = document.getElementById('camera-btn');
  const cameraInput = document.getElementById('camera-input');
  const ocrUse = document.getElementById('ocr-use');
  const ocrCancel = document.getElementById('ocr-cancel');
  const ocrClose = document.getElementById('ocr-close');

  cameraBtn?.addEventListener('click', () => {
    cameraInput?.click();
  });

  cameraInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleCameraCapture(file);
    cameraInput.value = '';
  });

  ocrUse?.addEventListener('click', () => {
    const text = document.getElementById('ocr-text')?.value?.trim();
    if (!text) return;
    const notesEl = document.getElementById('notes');
    notesEl.value = text;
    notesEl.dispatchEvent(new Event('input'));
    hideOcrReview();
  });

  ocrCancel?.addEventListener('click', hideOcrReview);
  ocrClose?.addEventListener('click', hideOcrReview);
}

// INIT
(function init() {
  initOnboard();
  renderHist();
  initVoice();
  initCamera();
})();// ============================
// UGNAI - app.js
// Calls /api/generate (server-side proxy).
// ============================

const S = {
  audience: 'parents',
  format:   'letter',
  language: 'Filipino',
  tone:     'warm',
  output:   '',
  batch:    {},
};

// ONBOARDING
let obStep = 1;
function initOnboard() {
  if (!localStorage.getItem('ugnai_seen'))
    document.getElementById('onboarding').classList.remove('hidden');
}
document.getElementById('ob-next')?.addEventListener('click', () => {
  const steps = document.querySelectorAll('.ob-step');
  const dots  = document.querySelectorAll('.dot');
  steps[obStep - 1].classList.remove('active');
  dots[obStep - 1].classList.remove('on');
  obStep++;
  if (obStep > steps.length) {
    document.getElementById('onboarding').classList.add('hidden');
    localStorage.setItem('ugnai_seen', '1');
    return;
  }
  steps[obStep - 1].classList.add('active');
  dots[obStep - 1].classList.add('on');
  if (obStep === steps.length)
    document.getElementById('ob-next').textContent = 'Sige na!';
});

// WORD COUNT
const notesEl = document.getElementById('notes');
notesEl?.addEventListener('input', () => {
  const words = notesEl.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wcount').textContent = `${words} salita`;
  let msg = '';
  if (notesEl.value.length > 0 && words < 10)
    msg = `<span class="w-short">Medyo maikli pa. Dagdagan mo para mas maganda ang output.</span>`;
  else if (notesEl.value.length > 3000)
    msg = `<span class="w-long">Medyo mahaba na. Baka gusto mong hatiin sa dalawa?</span>`;
  document.getElementById('warn').innerHTML = msg;
});

// AUDIENCE
document.querySelectorAll('.aud').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.aud').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    S.audience = b.dataset.a;
    const df = { parents:'letter', students:'student-summary', deped:'deped-report', principal:'weekly' };
    setChip(df[S.audience] || 'letter');
  });
});

// FORMAT CHIPS
function setChip(f) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  const t = document.querySelector(`.chip[data-f="${f}"]`);
  if (t) { t.classList.add('on'); S.format = f; }
}
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    S.format = c.dataset.f;
  });
});

// LANGUAGE
document.querySelectorAll('#lang-pills .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#lang-pills .pill').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); S.language = b.dataset.v;
  });
});

// TONE
document.querySelectorAll('#tone-pills .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#tone-pills .pill').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); S.tone = b.dataset.v;
  });
});

// TEMPLATES
const TMPLS = {
  'parent-advisory':
`[Teacher name] Class Advisory — [Date]

Magandang araw po! Nais ko pong ipaalam sa inyo ang sumusunod:

Paksa: [Subject or topic]
Petsa ng aktibidad: [Date]
Kailangan ng bata: [What they need to bring or do]
Iba pang impormasyon: [Any other notes]

Salamat po sa inyong patuloy na suporta.`,

  'class-memo':
`MEMORANDUM

To: [Recipient]
From: [Teacher name]
Date: [Date]
Subject: [Memo subject]

[Write your memo content here. Include main points, action items, and deadlines.]

Action required by: [Date]`,

  'sf9-narrative':
`SF-9 Learner Progress Report Narrative

Pupil: [Student name]
Grade & Section: [Grade - Section]
School Year: [SY]
Quarter: [Q1/Q2/Q3/Q4]

Academic Performance:
[Describe the student's academic performance this quarter.]

Character and Values:
[Describe behavior, participation, and character traits observed.]

Areas for Improvement:
[Note areas needing attention or support from parents.]

Teacher's Recommendation:
[Write your recommendation for the student and parents.]`,

  'weekly-update':
`Week of [Date] — Class Update

What we covered this week:
- [Topic 1]
- [Topic 2]

Upcoming next week:
- [What is coming]

Reminders:
- [Reminder 1]

Assignments due:
- [Assignment] due [Date]`,

  'activity-reminder':
`Activity Reminder

Activity: [Name]
Date: [Date]
Time: [Time]
Venue: [Location]
What to bring: [List items]
What to wear: [Uniform or dress code]
Permission slip due: [Date]

Contact [teacher name] at [number] for questions.`,
};

document.getElementById('tmpl')?.addEventListener('change', e => {
  const val = e.target.value;
  if (!val || !TMPLS[val]) return;
  if (notesEl.value.trim() && !confirm('Palitan ang nakasulat mo ng template?')) {
    e.target.value = ''; return;
  }
  notesEl.value = TMPLS[val];
  notesEl.dispatchEvent(new Event('input'));
  e.target.value = '';
});

// PROMPT BUILDER
function buildPrompt(input, aud, fmt, lang, tone) {
  const audMap = {
    parents:   'parents of Filipino public school students. Tone: like a teacher texting a Viber parent group — warm, short, direct, conversational Taglish. Example opener: "Hi mga parents! Gusto lang i-remind..."',
    students:  'Filipino public school students. Tone: direct and clear, like a teacher giving a reminder to their class. Example opener: "Reminder lang na may quiz tayo this Friday..."',
    deped:     'DepEd officials or school administrators. Tone: professional but human, no bureaucratic filler. Clear subject line, short body, direct.',
    principal: 'the school principal. Tone: brief and respectful, like a hallway update turned into a short memo. Two paragraphs max.',
  };
  const fmtMap = {
    'letter':          'a letter with greeting, body paragraphs, and polite closing',
    'bulletin':        'a short bulletin — easy to scan, clear, direct',
    'deped-report':    'a formal DepEd report with subject line, body, and summary',
    'student-summary': 'a simple student-facing summary with bullet points and plain language',
    'reminder':        'a brief reminder notice with key dates and action items highlighted',
    'weekly':          'a weekly update with sections for covered topics, upcoming items, and reminders',
  };
  const toneMap = {
    warm:        'conversational and caring — like texting a friend or a parent you know well. Use "po" naturally but not excessively. Example: "Hi! Gusto lang i-remind na may quiz tayo this Friday."',
    formal:      'professional and clear — no slang, complete sentences, respectful. Like a formal memo but still readable.',
    simple:      'super easy to understand — short sentences, common words only, like explaining to a student or a parent who may not be confident in Filipino.',
    encouraging: 'positive and motivating — acknowledge effort, use affirming words. Like a teacher cheering on their students or thanking parents.',
  };

  return `You are a formatting assistant for Filipino public school teachers. Your ONLY job is to reformat the teacher's notes for a specific audience.

STRICT RULES:
- Do NOT add any facts, figures, examples, or content the teacher did not provide.
- Do NOT invent any detail. If something is missing, write [placeholder in brackets].
- Do NOT change the meaning of anything the teacher wrote.
- Only adjust language, tone, and format.
- Output plain text only — no asterisks, no bold, no markdown headers.

Audience: ${audMap[aud] || aud}
Format: ${fmtMap[fmt] || fmt}
Output language: ${lang}${lang === 'Taglish' ? ' (mix Filipino and English naturally, the way Filipino teachers actually text and talk, not forced translations)' : ''}
Tone: ${toneMap[tone] || tone}

Teacher's notes:
---
${input}
---

Output the reformatted draft only. No explanation, no intro sentence, no meta-commentary.`;
}

// API CALL via proxy
async function callAPI(prompt, keyHint = 0) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const WAITS = [0, 1500, 2500, 4000];

  for (let attempt = 0; attempt < WAITS.length; attempt++) {
    if (WAITS[attempt] > 0) await sleep(WAITS[attempt]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, keyHint: keyHint + attempt }),
      });

      // Always retry on 429 or 5xx
      if (res.status === 429 || res.status >= 500) continue;

      if (!res.ok) {
        // 4xx errors won't get better with retry
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Error');
      }

      const d = await res.json();
      return stripMarkdown(d.text);

    } catch (err) {
      // Network error -- retry unless it's the last attempt
      if (attempt === WAITS.length - 1) throw err;
    }
  }
  throw new Error('Subukan ulit mamaya.');
}

function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** -> bold
    .replace(/\*(.+?)\*/g, '$1')        // *italic* -> italic
    .replace(/^#{1,6}\s+/gm, '')        // ### headers
    .replace(/^[-*]\s+/gm, '• ')        // - bullet -> • bullet (readable)
    .replace(/^\d+\.\s+/gm, '')         // 1. numbered list markers
    .trim();
}

// GENERATE SINGLE
async function genSingle() {
  const input = notesEl.value.trim();
  if (!input) { alert('Isulat mo muna ang tala mo.'); return; }

  const btn = document.getElementById('gen-btn');
  const lbl = document.getElementById('gen-lbl');
  const spn = document.getElementById('gen-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.remove('hidden');
  document.getElementById('batch-out').classList.add('hidden');
  document.getElementById('out-text').innerHTML =
    '<div class="out-empty" style="font-style:normal;color:var(--ink3)">Hinihintay ang output...</div>';

  try {
    const result = await callAPI(buildPrompt(input, S.audience, S.format, S.language, S.tone));
    S.output = result;
    document.getElementById('out-text').textContent = result;
    saveHist({ input, output: result, audience: S.audience, format: S.format, language: S.language, tone: S.tone });
  } catch (err) {
    document.getElementById('out-text').textContent = 'May problema. Subukan ulit mamaya.';
  } finally {
    btn.disabled = false; lbl.classList.remove('hidden'); spn.classList.add('hidden');
  }
}
document.getElementById('gen-btn')?.addEventListener('click', genSingle);
document.getElementById('regen-btn')?.addEventListener('click', genSingle);

// BATCH GENERATE
async function genBatch() {
  const input = notesEl.value.trim();
  if (!input) { alert('Isulat mo muna ang tala mo.'); return; }

  const btn = document.getElementById('batch-btn');
  const lbl = document.getElementById('batch-lbl');
  const spn = document.getElementById('batch-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.add('hidden');
  document.getElementById('batch-out').classList.remove('hidden');

  const auds = ['parents','students','deped','principal'];
  const fmts = { parents:'letter', students:'student-summary', deped:'deped-report', principal:'weekly' };
  auds.forEach(a => { document.getElementById(`b-${a}`).textContent = 'Ginagawa...'; });

  try {
    // Sequential with 1.2s delay between calls - avoids rate limits on free tier keys
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < auds.length; i++) {
      const a = auds[i];
      document.getElementById(`b-${a}`).textContent = 'Ginagawa...';
      try {
        const result = await callAPI(buildPrompt(input, a, fmts[a], S.language, S.tone), i);
        S.batch[a] = result;
        document.getElementById(`b-${a}`).textContent = result;
      } catch (e) {
        S.batch[a] = `Hindi nagawa: ${e.message}`;
        document.getElementById(`b-${a}`).textContent = `Hindi nagawa: ${e.message}`;
      }
      if (i < auds.length - 1) await delay(1500);
    }
    saveHist({ input, output: '[Batch] Para sa lahat generated', batchOutputs: { ...S.batch }, audience: 'batch', format: 'batch', language: S.language, tone: S.tone });
  } catch (e) {
    auds.forEach(a => { document.getElementById(`b-${a}`).textContent = `Error: ${e.message}`; });
  } finally {
    btn.disabled = false; lbl.classList.remove('hidden'); spn.classList.add('hidden');
  }
}
document.getElementById('batch-btn')?.addEventListener('click', genBatch);

// BATCH COPY
document.querySelectorAll('.bc').forEach(b => {
  b.addEventListener('click', () => {
    const txt = S.batch[b.dataset.t] || '';
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
      const orig = b.innerHTML;
      b.innerHTML = `<svg width="12" height="12"><use href="#i-check"/></svg>`;
      setTimeout(() => { b.innerHTML = orig; }, 1600);
    });
  });
});

// COPY
document.getElementById('copy-btn')?.addEventListener('click', () => {
  if (!S.output) return;
  navigator.clipboard.writeText(S.output).then(() => {
    document.getElementById('copy-lbl').textContent = 'Nakopya!';
    document.getElementById('copy-ico').innerHTML = `<use href="#i-check"/>`;
    setTimeout(() => {
      document.getElementById('copy-lbl').textContent = 'Kopyahin';
      document.getElementById('copy-ico').innerHTML = `<use href="#i-copy"/>`;
    }, 1800);
  });
});

// PDF
document.getElementById('pdf-btn')?.addEventListener('click', () => {
  if (!S.output) { alert('Wala pang output. Mag-generate muna.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const m = 22, pw = doc.internal.pageSize.getWidth() - m * 2;
  let y = m;

  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(26,23,20);
  doc.text('UGNai: Reformatted Draft', m, y); y += 8;

  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(122,114,105);
  doc.text(`Audience: ${S.audience}  |  Format: ${S.format}  |  Language: ${S.language}  |  Tone: ${S.tone}`, m, y); y += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, m, y); y += 5;
  doc.setTextColor(192,57,43); doc.text('DRAFT: Review before sending', m, y); y += 9;

  doc.setDrawColor(210,200,190); doc.line(m, y, m + pw, y); y += 8;

  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(26,23,20);
  doc.splitTextToSize(S.output, pw).forEach(line => {
    if (y > 272) { doc.addPage(); y = m; }
    doc.text(line, m, y); y += 6.5;
  });
  doc.save(`UGNai_${S.audience}_${Date.now()}.pdf`);
});

// FEEDBACK
document.querySelectorAll('.fb').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.fb').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const fb = JSON.parse(localStorage.getItem('ugnai_fb') || '[]');
    fb.push({ v: b.dataset.v, ts: Date.now(), a: S.audience });
    localStorage.setItem('ugnai_fb', JSON.stringify(fb.slice(-100)));
  });
});

// HISTORY
function saveHist(entry) {
  const h = JSON.parse(localStorage.getItem('ugnai_hist') || '[]');
  h.unshift({ ...entry, id: Date.now(), ts: new Date().toISOString() });
  localStorage.setItem('ugnai_hist', JSON.stringify(h.slice(0, 50)));
  renderHist();
}
function renderHist(filter = '') {
  const h = JSON.parse(localStorage.getItem('ugnai_hist') || '[]');
  const el = document.getElementById('hist-list');
  if (!el) return;
  const filtered = h.filter(x =>
    !filter ||
    x.output.toLowerCase().includes(filter.toLowerCase()) ||
    x.input.toLowerCase().includes(filter.toLowerCase())
  );
  if (!filtered.length) {
    el.innerHTML = '<div style="color:var(--ink4);font-size:13px;text-align:center;padding:28px">Wala pang nakaraang draft</div>';
    return;
  }
  el.innerHTML = filtered.map(x => `
    <div class="hist-item" data-id="${x.id}">
      <div class="hist-meta">${new Date(x.ts).toLocaleString()} · ${x.audience} · ${x.language}</div>
      <div class="hist-preview">${x.output.substring(0, 120)}...</div>
    </div>`).join('');
  el.querySelectorAll('.hist-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const entry = h.find(x => x.id === id);
      if (!entry) return;
      notesEl.value = entry.input;
      notesEl.dispatchEvent(new Event('input'));
      if (entry.batchOutputs) {
        Object.entries(entry.batchOutputs).forEach(([a, t]) => {
          const el2 = document.getElementById(`b-${a}`);
          if (el2) { el2.textContent = t; S.batch[a] = t; }
        });
        document.getElementById('single-out').classList.add('hidden');
        document.getElementById('batch-out').classList.remove('hidden');
      } else {
        S.output = entry.output;
        document.getElementById('out-text').textContent = entry.output;
        document.getElementById('single-out').classList.remove('hidden');
        document.getElementById('batch-out').classList.add('hidden');
      }
      document.getElementById('hist-panel').classList.add('hidden');
    });
  });
}

document.getElementById('hist-q')?.addEventListener('input', e => renderHist(e.target.value));
document.getElementById('hist-toggle')?.addEventListener('click', () => {
  document.getElementById('hist-panel').classList.toggle('hidden');
  renderHist();
});
document.getElementById('hist-close')?.addEventListener('click', () =>
  document.getElementById('hist-panel').classList.add('hidden'));
document.getElementById('hist-clear')?.addEventListener('click', () => {
  if (!confirm('Burahin lahat ng nakaraan?')) return;
  localStorage.removeItem('ugnai_hist');
  renderHist();
});

// VOICE INPUT
// Uses Web Speech API for real-time transcription
// Supports Filipino (fil-PH) and English

let recognition = null;
let isRecording = false;

function initVoice() {
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (btn) {
      btn.disabled = true;
      btn.title = 'Hindi sinusuportahan ng browser na ito ang voice input. Gamitin ang Chrome.';
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = S.language === 'English' ? 'en-PH' : 'fil-PH';

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t + ' ';
      } else {
        interim = t;
      }
    }
    const notesEl = document.getElementById('notes');
    notesEl.value = finalTranscript + interim;
    notesEl.dispatchEvent(new Event('input'));
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    stopRecording();
    if (event.error === 'not-allowed') {
      alert('Hindi binigyan ng permiso ang mikropono. I-allow ang microphone sa browser settings.');
    }
  };

  recognition.onend = () => {
    if (isRecording) stopRecording();
  };

  btn?.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

function startRecording() {
  if (!recognition) return;
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  recognition.lang = S.language === 'English' ? 'en-PH' : 'fil-PH';
  recognition.start();
  isRecording = true;
  btn?.classList.add('recording');
  if (label) label.textContent = 'Itigil';
}

function stopRecording() {
  recognition?.stop();
  isRecording = false;
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  btn?.classList.remove('recording');
  if (label) label.textContent = 'Magsalita';
}

// CAMERA OCR
// Sends photo to Groq Vision, shows extracted text for review before using

async function handleCameraCapture(file) {
  if (!file) return;

  const label = document.getElementById('camera-label');
  const btn = document.getElementById('camera-btn');

  btn.disabled = true;
  if (label) label.textContent = 'Binabasa...';

  try {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mimeType }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Hindi nabasa ang larawan.');
    }

    const data = await res.json();
    showOcrReview(data.text);

  } catch (err) {
    alert('Hindi nabasa ang larawan: ' + err.message);
  } finally {
    btn.disabled = false;
    if (label) label.textContent = 'Kumuha ng Litrato';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showOcrReview(text) {
  const review = document.getElementById('ocr-review');
  const ocrText = document.getElementById('ocr-text');
  if (!review || !ocrText) return;
  ocrText.value = text;
  review.classList.remove('hidden');
  ocrText.focus();
}

function hideOcrReview() {
  document.getElementById('ocr-review')?.classList.add('hidden');
}

function initCamera() {
  const cameraBtn = document.getElementById('camera-btn');
  const cameraInput = document.getElementById('camera-input');
  const ocrUse = document.getElementById('ocr-use');
  const ocrCancel = document.getElementById('ocr-cancel');
  const ocrClose = document.getElementById('ocr-close');

  cameraBtn?.addEventListener('click', () => {
    cameraInput?.click();
  });

  cameraInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleCameraCapture(file);
    cameraInput.value = '';
  });

  ocrUse?.addEventListener('click', () => {
    const text = document.getElementById('ocr-text')?.value?.trim();
    if (!text) return;
    const notesEl = document.getElementById('notes');
    notesEl.value = text;
    notesEl.dispatchEvent(new Event('input'));
    hideOcrReview();
  });

  ocrCancel?.addEventListener('click', hideOcrReview);
  ocrClose?.addEventListener('click', hideOcrReview);
}

// INIT
(function init() {
  initOnboard();
  renderHist();
  initVoice();
  initCamera();
})();
