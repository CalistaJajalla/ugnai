// ============================
// UGNAI - app.js
// Calls /api/generate (server-side proxy).
// ============================

const S = {
  audience: 'parents',
  format:   'letter',
  language: 'English',
  tone:     'warm',
  output:   '',
  batch:    {},
};

// Site language (UI language - separate from output language)
let siteLang = localStorage.getItem('ugnai_site_lang') || 'tagalog';

// ============================
// TRANSLATIONS
// ============================
const T = {
  tagalog: {
    // Header
    'history': 'Nakaraan',
    // Meaning strip
    'meaning_sub': 'mula sa salitang <em>guro</em>, gawa para sa bawat guro sa Pilipinas',
    // Notes section
    'your_notes': 'Iyong Tala',
    'word_count': 'salita',
    'math_mode': 'Math Mode',
    'notes_placeholder': 'Halimbawa: May quiz kami sa AP next week tungkol sa Pilipinas noong Kastila. Kailangan ng notebook at ballpen. Miyerkules, Abril 30.',
    'speak': 'Magsalita',
    'stop_recording': 'Itigil',
    'take_photo': 'Kumuha ng Litrato',
    'reading': 'Binabasa...',
    // Word count warnings
    'word_short': 'Medyo maikli pa. Dagdagan mo para mas maganda ang output.',
    'word_long': 'Medyo mahaba na. Baka gusto mong hatiin sa dalawa?',
    // OCR
    'ocr_title': 'Nascan na text. Suriin bago gamitin:',
    'use_this': 'Gamitin ito',
    'cancel': 'Kanselahin',
    // Math mode panel
    'math_desc': 'I-type o kumuha ng litrato ng equation. Mag-ge-generate ng explanation o word problem para sa iyong klase.',
    'math_placeholder': 'Halimbawa: x^2 + 3x - 4 = 0',
    'photo': 'Litrato',
    'explanation': 'Explanation',
    'word_problem': 'Word Problem',
    'generate': 'I-generate',
    'use_in_notes': 'Gamitin sa notes',
    // Settings
    'for_whom': 'Para kanino?',
    'parents': 'Magulang',
    'students': 'Estudyante',
    'deped': 'DepEd',
    'principal': 'Punong-Guro',
    'doc_type': 'Anong klase ng sulat?',
    'letter': 'Liham',
    'bulletin': 'Bulletin',
    'deped_report': 'DepEd Report',
    'for_students': 'Para sa Bata',
    'reminder': 'Paalala',
    'weekly': 'Weekly Update',
    'language': 'Wika',
    'tone': 'Tono',
    'warm': 'Mainit',
    'formal': 'Pormal',
    'simple': 'Simple',
    'encouraging': 'Mapanghikayat',
    'template': 'May template ba?',
    'for_all': 'Para sa Lahat',
    // Output
    'output': 'Output',
    'draft_warning': 'Draft lang ito. Basahin muna bago ipadala.',
    'retry': 'Ulitin',
    'copy': 'Kopyahin',
    'copied': 'Nakopya!',
    'listen': 'Pakinggan',
    'loading_audio': 'Naglo-load...',
    'stop': 'Itigil',
    'helpful': 'Nakatulong?',
    'waiting_output': 'Hinihintay ang output...',
    'generate_first': 'Mag-generate ka muna para lumabas ang output dito.',
    'generate_hint': 'Isulat ang gusto mong iparating sa kanan, piliin ang audience, tapos i-generate.',
    'processing': 'Ginagawa...',
    'failed': 'Hindi nagawa:',
    // History
    'no_history': 'Wala pang nakaraang draft',
    'search': 'Hanapin...',
    'delete_all': 'Burahin Lahat',
    'confirm_delete': 'Burahin lahat ng nakaraan?',
    // Alerts
    'write_first': 'Isulat mo muna ang tala mo.',
    'no_output_yet': 'Wala pang output. Mag-generate muna.',
    'replace_template': 'Palitan ang nakasulat mo ng template?',
    'try_again': 'May problema. Subukan ulit mamaya.',
    'mic_not_allowed': 'Hindi binigyan ng permiso ang mikropono. I-allow ang microphone sa browser settings.',
    'voice_not_available': 'Hindi available ang voice input sa iyong browser.\n\nSubukan sa Chrome, Edge, o Safari para gumana ito.',
    'audio_not_available': 'Audio ay hindi available sa iyong browser.',
    'image_not_read': 'Hindi nabasa ang larawan:',
    'type_or_photo': 'I-type ang equation o kumuha ng litrato.',
    'no_equation_detected': 'Hindi makita ang equation sa larawan. Subukan kumuha ng mas malinaw na litrato.',
    // Language picker
    'choose_language': 'Piliin ang wika ng interface',
    'language_desc': 'Ito ay para sa mga labels at buttons. Ang output ng AI ay nakadepende pa rin sa setting ng "Wika" sa baba.',
    'continue': 'Magpatuloy',
    // Math mode reminder (English)
    'math_reminder': 'Note: Math Mode generates content in English for clarity.',
  },
  english: {
    // Header
    'history': 'History',
    // Meaning strip
    'meaning_sub': 'from the word <em>guro</em> (teacher), made for every teacher in the Philippines',
    // Notes section
    'your_notes': 'Your Notes',
    'word_count': 'words',
    'math_mode': 'Math Mode',
    'notes_placeholder': 'Example: We have a quiz in AP next week about the Philippines during the Spanish era. Students need a notebook and ballpen. Wednesday, April 30.',
    'speak': 'Speak',
    'stop_recording': 'Stop',
    'take_photo': 'Take Photo',
    'reading': 'Reading...',
    // Word count warnings
    'word_short': 'A bit short. Add more for better output.',
    'word_long': 'Getting long. Consider splitting into two?',
    // OCR
    'ocr_title': 'Scanned text. Review before using:',
    'use_this': 'Use this',
    'cancel': 'Cancel',
    // Math mode panel
    'math_desc': 'Type or take a photo of an equation. Generate an explanation or word problem for your class.',
    'math_placeholder': 'Example: x^2 + 3x - 4 = 0',
    'photo': 'Photo',
    'explanation': 'Explanation',
    'word_problem': 'Word Problem',
    'generate': 'Generate',
    'use_in_notes': 'Use in notes',
    // Settings
    'for_whom': 'For whom?',
    'parents': 'Parents',
    'students': 'Students',
    'deped': 'DepEd',
    'principal': 'Principal',
    'doc_type': 'What type of document?',
    'letter': 'Letter',
    'bulletin': 'Bulletin',
    'deped_report': 'DepEd Report',
    'for_students': 'For Students',
    'reminder': 'Reminder',
    'weekly': 'Weekly Update',
    'language': 'Language',
    'tone': 'Tone',
    'warm': 'Warm',
    'formal': 'Formal',
    'simple': 'Simple',
    'encouraging': 'Encouraging',
    'template': 'Use a template?',
    'for_all': 'For All Audiences',
    // Output
    'output': 'Output',
    'draft_warning': 'This is just a draft. Review before sending.',
    'retry': 'Retry',
    'copy': 'Copy',
    'copied': 'Copied!',
    'listen': 'Listen',
    'loading_audio': 'Loading...',
    'stop': 'Stop',
    'helpful': 'Helpful?',
    'waiting_output': 'Waiting for output...',
    'generate_first': 'Generate first to see output here.',
    'generate_hint': 'Write your notes on the right, choose the audience, then generate.',
    'processing': 'Processing...',
    'failed': 'Failed:',
    // History
    'no_history': 'No history yet',
    'search': 'Search...',
    'delete_all': 'Delete All',
    'confirm_delete': 'Delete all history?',
    // Alerts
    'write_first': 'Write your notes first.',
    'no_output_yet': 'No output yet. Generate first.',
    'replace_template': 'Replace your text with this template?',
    'try_again': 'Something went wrong. Try again later.',
    'mic_not_allowed': 'Microphone permission not granted. Allow microphone in browser settings.',
    'voice_not_available': 'Voice input is not available in your browser.\n\nTry Chrome, Edge, or Safari.',
    'audio_not_available': 'Audio is not available in your browser.',
    'image_not_read': 'Could not read the image:',
    'type_or_photo': 'Type the equation or take a photo.',
    'no_equation_detected': 'Could not detect equation in image. Try taking a clearer photo.',
    // Language picker
    'choose_language': 'Choose interface language',
    'language_desc': 'This is for labels and buttons. AI output language depends on the "Language" setting below.',
    'continue': 'Continue',
    // Math mode reminder (English)
    'math_reminder': 'Note: Math Mode generates content in English for clarity.',
  }
};

function t(key) {
  return T[siteLang]?.[key] || T['tagalog'][key] || key;
}

function applyTranslations() {
  // Header
  const histToggle = document.getElementById('hist-toggle');
  if (histToggle) histToggle.innerHTML = `<svg width="14" height="14"><use href="#i-clock"/></svg> ${t('history')}`;
  
  // Meaning strip
  const meaningSub = document.querySelector('.meaning-sub');
  if (meaningSub) meaningSub.innerHTML = t('meaning_sub');
  
  // Notes section
  const notesH = document.querySelector('#tut-target-notes .card-h');
  if (notesH) notesH.innerHTML = `<svg width="14" height="14"><use href="#i-pen"/></svg> ${t('your_notes')}`;
  
  const notesEl = document.getElementById('notes');
  if (notesEl) notesEl.placeholder = t('notes_placeholder');
  
  const voiceLabel = document.getElementById('voice-label');
  if (voiceLabel && !document.getElementById('voice-btn')?.classList.contains('recording')) {
    voiceLabel.textContent = t('speak');
  }
  
  const cameraLabel = document.getElementById('camera-label');
  if (cameraLabel) cameraLabel.textContent = t('take_photo');
  
  // Math mode toggle
  const mathToggle = document.getElementById('math-toggle');
  if (mathToggle) mathToggle.innerHTML = `<svg width="13" height="13"><use href="#i-spark"/></svg> ${t('math_mode')}`;
  
  // Math panel
  const mathDesc = document.querySelector('.math-panel-desc');
  if (mathDesc) mathDesc.textContent = t('math_desc');
  
  const mathInput = document.getElementById('math-text-input');
  if (mathInput) mathInput.placeholder = t('math_placeholder');
  
  const mathCameraBtn = document.getElementById('math-camera-btn');
  if (mathCameraBtn) mathCameraBtn.innerHTML = `<svg width="14" height="14"><use href="#i-camera"/></svg> ${t('photo')}`;
  
  document.querySelectorAll('.math-mode-btn').forEach(btn => {
    if (btn.dataset.mode === 'explanation') btn.textContent = t('explanation');
    if (btn.dataset.mode === 'word_problem') btn.textContent = t('word_problem');
  });
  
  const mathGenLbl = document.getElementById('math-gen-lbl');
  if (mathGenLbl) mathGenLbl.textContent = t('generate');
  
  const mathUseBtn = document.getElementById('math-use-btn');
  if (mathUseBtn) mathUseBtn.textContent = t('use_in_notes');
  
  // Math reminder
  const mathReminder = document.getElementById('math-reminder');
  if (mathReminder) mathReminder.textContent = t('math_reminder');
  
  // OCR
  const ocrTitle = document.querySelector('.ocr-title');
  if (ocrTitle) ocrTitle.textContent = t('ocr_title');
  
  const ocrUse = document.getElementById('ocr-use');
  if (ocrUse) ocrUse.textContent = t('use_this');
  
  const ocrCancel = document.getElementById('ocr-cancel');
  if (ocrCancel) ocrCancel.textContent = t('cancel');
  
  // Settings
  const forWhom = document.querySelector('#tut-target-audience .grp-lbl');
  if (forWhom) forWhom.textContent = t('for_whom');
  
  document.querySelectorAll('.aud').forEach(btn => {
    const span = btn.querySelector('span');
    if (!span) return;
    if (btn.dataset.a === 'parents') span.textContent = t('parents');
    if (btn.dataset.a === 'students') span.textContent = t('students');
    if (btn.dataset.a === 'deped') span.textContent = t('deped');
    if (btn.dataset.a === 'principal') span.textContent = t('principal');
  });
  
  const docType = document.querySelector('#tut-target-settings > .grp:nth-child(2) > .grp-lbl');
  if (docType) docType.textContent = t('doc_type');
  
  document.querySelectorAll('.chip').forEach(chip => {
    if (chip.dataset.f === 'letter') chip.textContent = t('letter');
    if (chip.dataset.f === 'bulletin') chip.textContent = t('bulletin');
    if (chip.dataset.f === 'deped-report') chip.textContent = t('deped_report');
    if (chip.dataset.f === 'student-summary') chip.textContent = t('for_students');
    if (chip.dataset.f === 'reminder') chip.textContent = t('reminder');
    if (chip.dataset.f === 'weekly') chip.textContent = t('weekly');
  });
  
  const langLbl = document.querySelector('.two-row .grp:first-child .grp-lbl');
  if (langLbl) langLbl.textContent = t('language');
  
  const toneLbl = document.querySelector('.two-row .grp:last-child .grp-lbl');
  if (toneLbl) toneLbl.textContent = t('tone');
  
  document.querySelectorAll('#tone-pills .pill').forEach(pill => {
    if (pill.dataset.v === 'warm') pill.textContent = t('warm');
    if (pill.dataset.v === 'formal') pill.textContent = t('formal');
    if (pill.dataset.v === 'simple') pill.textContent = t('simple');
    if (pill.dataset.v === 'encouraging') pill.textContent = t('encouraging');
  });
  
  const tmplSel = document.getElementById('tmpl');
  if (tmplSel) {
    const firstOpt = tmplSel.querySelector('option[value=""]');
    if (firstOpt) firstOpt.textContent = t('template');
  }
  
  const genLbl = document.getElementById('gen-lbl');
  if (genLbl) genLbl.textContent = t('generate');
  
  const batchLbl = document.getElementById('batch-lbl');
  if (batchLbl) batchLbl.textContent = t('for_all');
  
  // Output
  const outputH = document.querySelector('#single-out .card-h');
  if (outputH) outputH.textContent = t('output');
  
  const draftFlag = document.querySelector('.draft-flag');
  if (draftFlag) draftFlag.innerHTML = `<svg width="13" height="13"><use href="#i-warn"/></svg> ${t('draft_warning')}`;
  
  const regenBtn = document.getElementById('regen-btn');
  if (regenBtn) regenBtn.innerHTML = `<svg width="12" height="12"><use href="#i-refresh"/></svg> ${t('retry')}`;
  
  const copyLbl = document.getElementById('copy-lbl');
  if (copyLbl && copyLbl.textContent !== t('copied')) copyLbl.textContent = t('copy');
  
  const speakLbl = document.getElementById('speak-lbl');
  if (speakLbl && speakLbl.textContent !== t('loading_audio') && speakLbl.textContent !== t('stop')) {
    speakLbl.textContent = t('listen');
  }
  
  const fbRow = document.querySelector('.fb-row span');
  if (fbRow) fbRow.textContent = t('helpful');
  
  // Batch output labels
  document.querySelectorAll('.b-lbl').forEach(lbl => {
    const text = lbl.textContent.trim();
    if (text.includes('Magulang') || text.includes('Parents')) {
      lbl.innerHTML = `<svg width="13" height="13"><use href="#i-parents"/></svg> ${t('parents')}`;
    }
    if (text.includes('Estudyante') || text.includes('Students')) {
      lbl.innerHTML = `<svg width="13" height="13"><use href="#i-students"/></svg> ${t('students')}`;
    }
    if (text.includes('DepEd')) {
      lbl.innerHTML = `<svg width="13" height="13"><use href="#i-govt"/></svg> ${t('deped')}`;
    }
    if (text.includes('Punong-Guro') || text.includes('Principal')) {
      lbl.innerHTML = `<svg width="13" height="13"><use href="#i-office"/></svg> ${t('principal')}`;
    }
  });
  
  // History
  const histTop = document.querySelector('.hist-top .card-h');
  if (histTop) histTop.textContent = t('history');
  
  const histQ = document.getElementById('hist-q');
  if (histQ) histQ.placeholder = t('search');
  
  const histClear = document.getElementById('hist-clear');
  if (histClear) histClear.innerHTML = `<svg width="13" height="13"><use href="#i-trash"/></svg> ${t('delete_all')}`;
  
  // Update empty output state
  const outEmpty = document.querySelector('.out-empty p');
  if (outEmpty) outEmpty.textContent = t('generate_first');
  
  const outEmptyHint = document.querySelector('.out-empty-hint');
  if (outEmptyHint) outEmptyHint.textContent = t('generate_hint');
}

// Language picker initialization
// Note: For first-time users, tutorial.js handles showing the lang picker before the tutorial
// This function handles returning users who might change language later
function initLangPicker() {
  // Load saved language preference
  const savedLang = localStorage.getItem('ugnai_site_lang');
  if (savedLang) {
    siteLang = savedLang;
  }
  
  // Update the language switch button label
  updateLangSwitchLabel();
  
  // Handle language switch button click
  const langSwitch = document.getElementById('lang-switch');
  langSwitch?.addEventListener('click', () => {
    // Toggle language
    siteLang = siteLang === 'english' ? 'tagalog' : 'english';
    localStorage.setItem('ugnai_site_lang', siteLang);
    updateLangSwitchLabel();
    applyTranslations();
  });
}

function updateLangSwitchLabel() {
  const label = document.getElementById('lang-switch-label');
  if (label) {
    label.textContent = siteLang === 'english' ? 'EN' : 'TL';
  }
}

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
    document.getElementById('ob-next').textContent = siteLang === 'english' ? 'Got it!' : 'Sige na!';
});

// WORD COUNT
const notesEl = document.getElementById('notes');
notesEl?.addEventListener('input', () => {
  const words = notesEl.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wcount').textContent = `${words} ${t('word_count')}`;
  let msg = '';
  if (notesEl.value.length > 0 && words < 10)
    msg = `<span class="w-short">${t('word_short')}</span>`;
  else if (notesEl.value.length > 3000)
    msg = `<span class="w-long">${t('word_long')}</span>`;
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
  if (notesEl.value.trim() && !confirm(t('replace_template'))) {
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
async function callAPI(prompt, keyHint = 0, language = 'English') {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const WAITS = [0, 1500, 2500, 4000];
  
  for (let attempt = 0; attempt < WAITS.length; attempt++) {
  if (WAITS[attempt] > 0) await sleep(WAITS[attempt]);
  try {
  const res = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, keyHint: keyHint + attempt, language }),
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
  if (!input) { alert(t('write_first')); return; }

  const btn = document.getElementById('gen-btn');
  const lbl = document.getElementById('gen-lbl');
  const spn = document.getElementById('gen-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.remove('hidden');
  document.getElementById('batch-out').classList.add('hidden');
  document.getElementById('out-text').innerHTML =
    `<div class="out-empty" style="font-style:normal;color:var(--ink3)">${t('waiting_output')}</div>`;

try {
const result = await callAPI(buildPrompt(input, S.audience, S.format, S.language, S.tone), 0, S.language);
S.output = result;
    document.getElementById('out-text').textContent = result;
    saveHist({ input, output: result, audience: S.audience, format: S.format, language: S.language, tone: S.tone });
  } catch (err) {
    document.getElementById('out-text').textContent = t('try_again');
  } finally {
    btn.disabled = false; lbl.classList.remove('hidden'); spn.classList.add('hidden');
  }
}
document.getElementById('gen-btn')?.addEventListener('click', genSingle);
document.getElementById('regen-btn')?.addEventListener('click', genSingle);

// BATCH GENERATE
async function genBatch() {
  const input = notesEl.value.trim();
  if (!input) { alert(t('write_first')); return; }

  const btn = document.getElementById('batch-btn');
  const lbl = document.getElementById('batch-lbl');
  const spn = document.getElementById('batch-spin');
  btn.disabled = true; lbl.classList.add('hidden'); spn.classList.remove('hidden');

  document.getElementById('single-out').classList.add('hidden');
  document.getElementById('batch-out').classList.remove('hidden');

  const auds = ['parents','students','deped','principal'];
  const fmts = { parents:'letter', students:'student-summary', deped:'deped-report', principal:'weekly' };
  auds.forEach(a => { document.getElementById(`b-${a}`).textContent = t('processing'); });

  try {
    // Run in pairs (2 at a time) to use both API keys while avoiding rate limits
    const delay = ms => new Promise(r => setTimeout(r, ms));
    
    // Process in batches of 2 for better performance
    for (let i = 0; i < auds.length; i += 2) {
      const batch = auds.slice(i, i + 2);
      
      // Run pair in parallel
      const promises = batch.map((a, idx) => {
        document.getElementById(`b-${a}`).textContent = t('processing');
        return callAPI(buildPrompt(input, a, fmts[a], S.language, S.tone), i + idx, S.language)
          .then(result => {
            S.batch[a] = result;
            document.getElementById(`b-${a}`).textContent = result;
          })
          .catch(e => {
            S.batch[a] = `${t('failed')} ${e.message}`;
            document.getElementById(`b-${a}`).textContent = `${t('failed')} ${e.message}`;
          });
      });
      
      await Promise.all(promises);
      
      // Small delay before next pair to avoid rate limits
      if (i + 2 < auds.length) await delay(1000);
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
    document.getElementById('copy-lbl').textContent = t('copied');
    document.getElementById('copy-ico').innerHTML = `<use href="#i-check"/>`;
    setTimeout(() => {
      document.getElementById('copy-lbl').textContent = t('copy');
      document.getElementById('copy-ico').innerHTML = `<use href="#i-copy"/>`;
    }, 1800);
  });
});

// PDF - Clean document format
document.getElementById('pdf-btn')?.addEventListener('click', () => {
  if (!S.output) { alert(t('no_output_yet')); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginLeft = 25;
  const marginRight = 25;
  const pageWidth = doc.internal.pageSize.getWidth() - marginLeft - marginRight;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 30;

  // Clean output text - replace em dashes and en dashes with regular hyphens
  const cleanOutput = S.output
    .replace(/—/g, '-')  // em dash to hyphen
    .replace(/–/g, '-')  // en dash to hyphen
    .replace(/"/g, '"')  // smart quotes
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/…/g, '...');  // ellipsis

  // Document header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 168); // Blue header
  doc.text('UGNAI', marginLeft, y);
  
  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Unified Guro Narrative AI', marginLeft + 22, y);
  y += 12;

  // Metadata line
  const audienceLabel = { parents: 'Magulang', students: 'Estudyante', deped: 'DepEd', principal: 'Punong-Guro' };
  const formatLabel = { letter: 'Liham', bulletin: 'Bulletin', 'deped-report': 'DepEd Report', 'student-summary': 'Para sa Bata', reminder: 'Paalala', weekly: 'Weekly Update' };
  const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Para sa: ${audienceLabel[S.audience] || S.audience}`, marginLeft, y);
  doc.text(`Petsa: ${dateStr}`, marginLeft + 60, y);
  y += 5;
  doc.text(`Uri: ${formatLabel[S.format] || S.format}`, marginLeft, y);
  doc.text(`Wika: ${S.language}`, marginLeft + 60, y);
  y += 8;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 10;

  // Main content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  
  const lines = doc.splitTextToSize(cleanOutput, pageWidth);
  const lineHeight = 6;
  
  lines.forEach(line => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 25;
    }
    doc.text(line, marginLeft, y);
    y += lineHeight;
  });

  // Footer with draft notice
  y = pageHeight - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setTextColor(180, 80, 80);
  doc.text('DRAFT - Suriin muna bago ipadala', marginLeft, y);
  doc.setTextColor(120, 120, 120);
  doc.text('Generated by UGNai', marginLeft + pageWidth - 35, y);

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
    el.innerHTML = `<div style="color:var(--ink4);font-size:13px;text-align:center;padding:28px">${t('no_history')}</div>`;
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
  if (!confirm(t('confirm_delete'))) return;
  localStorage.removeItem('ugnai_hist');
  renderHist();
});

// VOICE INPUT
// Uses Web Speech API for real-time transcription
// Supports Filipino (fil-PH) and English

let recognition = null;
let isRecording = false;
let voiceFinalTranscript = '';

function initVoice() {
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (btn) {
      btn.title = t('voice_not_available');
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        alert(t('voice_not_available'));
      });
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecording = true;
    const btn = document.getElementById('voice-btn');
    const label = document.getElementById('voice-label');
    btn?.classList.add('recording');
    if (label) label.textContent = t('stop_recording');
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        voiceFinalTranscript += transcript + ' ';
      } else {
        interim = transcript;
      }
    }
    const notesEl = document.getElementById('notes');
    if (notesEl) {
      notesEl.value = voiceFinalTranscript + interim;
      notesEl.dispatchEvent(new Event('input'));
    }
  };

  recognition.onerror = (event) => {
    stopRecording();
    if (event.error === 'not-allowed') {
      alert(t('mic_not_allowed'));
    } else if (event.error === 'no-speech') {
      // No speech detected - normal timeout, not an error
    } else if (event.error === 'network') {
      alert('Network error. Check your internet connection.');
    }
  };

  recognition.onend = () => {
    // Auto-restart if still supposed to be recording (browser stops after silence)
    if (isRecording) {
      try {
        recognition.start();
      } catch (e) {
        stopRecording();
      }
    }
  };

  btn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

function startRecording() {
  if (!recognition) {
    alert(t('voice_not_available'));
    return;
  }
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  
  // Set language based on current setting
  recognition.lang = S.language === 'English' ? 'en-US' : 'fil-PH';
  
  // Reset transcript for new recording
  voiceFinalTranscript = document.getElementById('notes')?.value || '';
  if (voiceFinalTranscript && !voiceFinalTranscript.endsWith(' ')) {
    voiceFinalTranscript += ' ';
  }
  
  try {
    recognition.start();
    // Note: isRecording and UI update happens in onstart handler
  } catch (e) {
    if (e.message?.includes('already started')) {
      recognition.stop();
      setTimeout(() => {
        try { recognition.start(); } catch (_) {}
      }, 100);
    } else {
      alert(t('voice_not_available'));
    }
  }
}

function stopRecording() {
  isRecording = false;
  try {
    recognition?.stop();
  } catch (e) {
    // Safe to ignore stop errors
  }
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
  btn?.classList.remove('recording');
  if (label) label.textContent = t('speak');
}

// CAMERA OCR
// Sends photo to Groq Vision, shows extracted text for review before using

async function handleCameraCapture(file) {
  if (!file) return;

  const label = document.getElementById('camera-label');
  const btn = document.getElementById('camera-btn');

  btn.disabled = true;
  if (label) label.textContent = t('reading');

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
    alert(t('image_not_read') + ' ' + err.message);
  } finally {
    btn.disabled = false;
    if (label) label.textContent = t('take_photo');
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

// MEM0 — remembers teacher preferences across sessions
// Uses localStorage as a simple persistent memory layer
// In a future version this can connect to the real mem0 API

const MEM0_KEY = 'ugnai_prefs';

function mem0Save() {
  const prefs = {
    language: S.language,
    tone: S.tone,
    audience: S.audience,
    format: S.format,
  };
  localStorage.setItem(MEM0_KEY, JSON.stringify(prefs));
}

function mem0Load() {
  try {
    const saved = localStorage.getItem(MEM0_KEY);
    if (!saved) return;
    const prefs = JSON.parse(saved);

    // Restore language
    if (prefs.language) {
      S.language = prefs.language;
      document.querySelectorAll('#lang-pills .pill').forEach(b => {
        b.classList.toggle('on', b.dataset.v === prefs.language);
      });
    }

    // Restore tone
    if (prefs.tone) {
      S.tone = prefs.tone;
      document.querySelectorAll('#tone-pills .pill').forEach(b => {
        b.classList.toggle('on', b.dataset.v === prefs.tone);
      });
    }

    // Restore audience
    if (prefs.audience) {
      S.audience = prefs.audience;
      document.querySelectorAll('.aud').forEach(b => {
        b.classList.toggle('on', b.dataset.a === prefs.audience);
      });
    }

    // Restore format
    if (prefs.format) {
      S.format = prefs.format;
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('on', c.dataset.f === prefs.format);
      });
    }
  } catch (_) {}
}

// Save prefs whenever any control changes
function hookMem0() {
  document.querySelectorAll('.aud, .chip, #lang-pills .pill, #tone-pills .pill').forEach(el => {
    el.addEventListener('click', () => setTimeout(mem0Save, 100));
  });
}

// ELEVENLABS — listen to output
let currentAudio = null;

async function speakOutput() {
  const text = S.output;
  if (!text) { alert(t('no_output_yet')); return; }

  const btn = document.getElementById('speak-btn');
  const lbl = document.getElementById('speak-lbl');

  // If already playing, stop it
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    lbl.textContent = t('listen');
    return;
  }

  btn.disabled = true;
  lbl.textContent = t('loading_audio');

  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      // ElevenLabs not configured — fall back to browser TTS
      const e = await res.json().catch(() => ({}));
      if (res.status === 503) {
        browserSpeak(text);
        return;
      }
      throw new Error(e.error || 'Hindi nagawa ang audio.');
    }

    const data = await res.json();
    const audioSrc = `data:${data.mimeType};base64,${data.audio}`;
    currentAudio = new Audio(audioSrc);
    currentAudio.play();
    lbl.textContent = t('stop');

    currentAudio.onended = () => {
      lbl.textContent = t('listen');
      currentAudio = null;
    };

  } catch (err) {
    // Fall back to browser TTS
    browserSpeak(text);
  } finally {
    btn.disabled = false;
  }
}

function browserSpeak(text) {
  // Browser built-in TTS as fallback when ElevenLabs not available
  const lbl = document.getElementById('speak-lbl');
  if (!window.speechSynthesis) {
    alert(t('audio_not_available'));
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = S.language === 'English' ? 'en-PH' : 'fil-PH';
  utt.rate = 0.9;
  utt.onend = () => { lbl.textContent = t('listen'); };
  window.speechSynthesis.speak(utt);
  lbl.textContent = t('stop');
}

document.getElementById('speak-btn')?.addEventListener('click', speakOutput);

// MATH MODE
let mathMode = 'explanation';

function initMathMode() {
  const toggleBtn = document.getElementById('math-toggle');
  const panel = document.getElementById('math-panel');
  const separator = document.getElementById('math-separator');
  const closeBtn = document.getElementById('math-close');
  const genBtn = document.getElementById('math-generate-btn');
  const lbl = document.getElementById('math-gen-lbl');
  const spn = document.getElementById('math-gen-spin');
  const cameraBtn = document.getElementById('math-camera-btn');
  const cameraInput = document.getElementById('math-camera-input');
  const useBtn = document.getElementById('math-use-btn');

  // Toggle panel with separator
  toggleBtn?.addEventListener('click', () => {
    const isOpen = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', isOpen);
    if (separator) separator.style.display = isOpen ? 'none' : 'block';
    toggleBtn.classList.toggle('on', !isOpen);
  });

  closeBtn?.addEventListener('click', () => {
    panel.classList.add('hidden');
    if (separator) separator.style.display = 'none';
    toggleBtn?.classList.remove('on');
  });

  // Mode buttons
  document.querySelectorAll('.math-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.math-mode-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      mathMode = btn.dataset.mode;
    });
  });

  // Camera input
  cameraBtn?.addEventListener('click', () => cameraInput?.click());
  cameraInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cameraInput.value = '';
    await runMathGenerate(file, null);
  });

  // Text generate
  genBtn?.addEventListener('click', async () => {
    const textInput = document.getElementById('math-text-input')?.value?.trim();
    if (!textInput) { alert(t('type_or_photo')); return; }
    await runMathGenerate(null, textInput);
  });

  // Use result in notes
  useBtn?.addEventListener('click', () => {
    const contentBox = document.getElementById('math-content-box');
    if (!contentBox?.textContent) return;
    const notesEl = document.getElementById('notes');
    notesEl.value = contentBox.textContent;
    notesEl.dispatchEvent(new Event('input'));
    panel.classList.add('hidden');
    toggleBtn?.classList.remove('on');
  });
}

async function runMathGenerate(imageFile, textInput) {
  const genBtn = document.getElementById('math-generate-btn');
  const lbl = document.getElementById('math-gen-lbl');
  const spn = document.getElementById('math-gen-spin');
  const result = document.getElementById('math-result');
  const eqBox = document.getElementById('math-eq-box');
  const contentBox = document.getElementById('math-content-box');

  genBtn.disabled = true;
  lbl.classList.add('hidden');
  spn.classList.remove('hidden');
  result.classList.add('hidden');

  try {
    const body = {
      audience: S.audience,
      language: S.language,
      mode: mathMode,
    };

    if (imageFile) {
      body.image = await fileToBase64(imageFile);
      body.mimeType = imageFile.type || 'image/jpeg';
    } else {
      body.text = textInput;
    }

    const res = await fetch('/api/math', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'May problema. Subukan ulit.');
    }

    const data = await res.json();

    // Check if we got valid data
    if (!data.latex || !data.content) {
      throw new Error('Hindi makita ang equation. Subukan ulit.');
    }

    // Render equation using KaTeX
    eqBox.innerHTML = '';
    eqBox.classList.remove('math-error');
    try {
      if (window.katex && data.latex) {
        // Clean up common issues in LaTeX
        let cleanLatex = data.latex
          .replace(/\\\\/g, '\\')  // Fix double backslashes
          .replace(/\$\$/g, '')    // Remove $$ markers if present
          .replace(/^\$|\$$/g, '') // Remove $ markers
          .trim();
        
        katex.render(cleanLatex, eqBox, { 
          throwOnError: false, 
          displayMode: true,
          trust: true
        });
      } else {
        eqBox.textContent = data.latex;
      }
    } catch (katexErr) {
      // Fallback: show the raw LaTeX in a readable format
      eqBox.textContent = data.latex;
    }

    contentBox.textContent = data.content;
    result.classList.remove('hidden');

  } catch (err) {
    // Show error in the result area instead of alert
    result.classList.remove('hidden');
    eqBox.innerHTML = '';
    eqBox.classList.add('math-error');
    eqBox.textContent = err.message || 'Hindi makita ang equation sa larawan.';
    contentBox.textContent = '';
  } finally {
    genBtn.disabled = false;
    lbl.classList.remove('hidden');
    spn.classList.add('hidden');
  }
}

// INIT
(function init() {
  initOnboard();
  renderHist();
  initVoice();
  initCamera();
  initMathMode();
  mem0Load();
  hookMem0();
  initLangPicker();
  applyTranslations();
})();
