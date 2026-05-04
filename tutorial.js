// tutorial.js: Step-by-step guided walkthrough
// Highlights real UI elements with a spotlight effect.
// Only shows on first visit. Can be dismissed anytime.

// Get site language from localStorage (default to tagalog)
function getSiteLang() {
  return localStorage.getItem('ugnai_site_lang') || 'tagalog';
}

const STEPS_TAGALOG = [
  {
    target: 'tut-target-notes',
    icon:  'i-pen',
    title: 'Isulat ang iyong tala',
    body:  'I-type o i-paste ang iyong lesson notes, announcements, o anumang mensahe dito. Huwag mag-alala sa format, magsulat lang ng natural sa wikang komportable mo.',
    pos:   'right',
  },
  {
    target: 'tut-target-audience',
    icon:  'i-parents',
    title: 'Piliin ang tatanggap',
    body:  'Sino ang magbabasa ng mensahe? Pumili ng Magulang, Mag-aaral, DepEd, o Punong-Guro. Bawat isa ay may naiibang tono at format na awtomatikong gagamitin ng UGNai.',
    pos:   'right',
  },
  {
    target: null,
    icon:  'i-spark',
    title: 'Format at wika',
    body:  'Piliin kung anong uri ng dokumento (liham, bulletin, report) at sa anong wika. Maaari ring piliin ang tono: mainit para sa magulang, pormal para sa DepEd.',
    pos:   'center',
  },
  {
    target: 'tut-target-generate',
    icon:  'i-spark',
    title: 'I-generate ang draft',
    body:  'I-click ang "I-generate" para sa isang output, o "Lahat ng Madla" para makakuha ng apat na bersyon nang sabay-sabay: para sa magulang, mag-aaral, DepEd, at punong-guro.',
    pos:   'right',
  },
  {
    target: 'tut-target-output',
    icon:  'i-copy',
    title: 'Suriin at kopyahin',
    body:  'Laging suriin ang output bago ipadala. I-click ang "Kopyahin" at i-paste sa iyong messaging app o email. Ikaw pa rin ang nagpapadala, hindi awtomatiko.',
    pos:   'left',
  },
];

const STEPS_ENGLISH = [
  {
    target: 'tut-target-notes',
    icon:  'i-pen',
    title: 'Write your notes',
    body:  'Type or paste your lesson notes, announcements, or any message here. Don\'t worry about formatting, just write naturally in your preferred language.',
    pos:   'right',
  },
  {
    target: 'tut-target-audience',
    icon:  'i-parents',
    title: 'Choose the recipient',
    body:  'Who will read the message? Choose Parents, Students, DepEd, or Principal. Each has a different tone and format that UGNai will automatically use.',
    pos:   'right',
  },
  {
    target: null,
    icon:  'i-spark',
    title: 'Format and language',
    body:  'Choose what type of document (letter, bulletin, report) and in what language. You can also select the tone: warm for parents, formal for DepEd.',
    pos:   'center',
  },
  {
    target: 'tut-target-generate',
    icon:  'i-spark',
    title: 'Generate the draft',
    body:  'Click "Generate" for one output, or "For All Audiences" to get four versions at once: for parents, students, DepEd, and principal.',
    pos:   'right',
  },
  {
    target: 'tut-target-output',
    icon:  'i-copy',
    title: 'Review and copy',
    body:  'Always review the output before sending. Click "Copy" and paste into your messaging app or email. You are still the sender, not automatic.',
    pos:   'left',
  },
];

function getSteps() {
  return getSiteLang() === 'english' ? STEPS_ENGLISH : STEPS_TAGALOG;
}

let currentStep = 0;
let spotlight = null;

function getTutorialWrap() { return document.getElementById('tutorial'); }
function getCard()          { return document.getElementById('tut-card'); }

function createSpotlight() {
  if (spotlight) return spotlight;
  spotlight = document.createElement('div');
  spotlight.className = 'tut-spotlight';
  document.getElementById('tutorial').appendChild(spotlight);
  return spotlight;
}

function getRect(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left, width: r.width, height: r.height };
}

function positionCard(rect, pos) {
  const card = getCard();
  const cw = 300;
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;

  if (!rect || pos === 'center') {
    // Center of screen
    top  = (vh - 320) / 2;
    left = (vw - cw)  / 2;
  } else if (pos === 'right') {
    left = rect.left + rect.width + pad;
    top  = rect.top  + (rect.height / 2) - 120;
    // If goes off right edge, flip to left
    if (left + cw > vw - pad) {
      left = rect.left - cw - pad;
    }
  } else if (pos === 'left') {
    left = rect.left - cw - pad;
    top  = rect.top  + (rect.height / 2) - 120;
    if (left < pad) {
      left = rect.left + rect.width + pad;
    }
  }

  // Clamp within viewport
  top  = Math.max(pad, Math.min(top,  vh - 340));
  left = Math.max(pad, Math.min(left, vw - cw - pad));

  card.style.top  = top  + 'px';
  card.style.left = left + 'px';
}

function showStep(index) {
  const STEPS = getSteps();
  const step = STEPS[index];
  const wrap = getTutorialWrap();
  const card = getCard();
  const lang = getSiteLang();

  // Update badge
  document.getElementById('tut-badge').textContent = `${index + 1} / ${STEPS.length}`;

  // Update icon
  document.getElementById('tut-icon').innerHTML =
    `<svg width="24" height="24"><use href="#${step.icon}"/></svg>`;

  // Update text
  document.getElementById('tut-title').textContent = step.title;
  document.getElementById('tut-body').textContent  = step.body;

  // Update dots
  document.querySelectorAll('.td').forEach((d, i) => {
    d.classList.toggle('on', i === index);
  });

  // Update button label on last step
  const nextBtn = document.getElementById('tut-next');
  if (index === STEPS.length - 1) {
    nextBtn.innerHTML = lang === 'english' 
      ? 'Done! <svg width="14" height="14"><use href="#i-check"/></svg>'
      : 'Tapos na! <svg width="14" height="14"><use href="#i-check"/></svg>';
  } else {
    nextBtn.innerHTML = lang === 'english'
      ? 'Next <svg width="14" height="14"><use href="#i-arrow-r"/></svg>'
      : 'Susunod <svg width="14" height="14"><use href="#i-arrow-r"/></svg>';
  }
  
  // Update skip button
  const skipBtn = document.getElementById('tut-skip');
  if (skipBtn) skipBtn.textContent = lang === 'english' ? 'Skip' : 'Laktawan';

  // Spotlight + position
  const sp = createSpotlight();

  if (step.target) {
    const rect = getRect(step.target);
    if (rect) {
      const pad = 8;
      sp.style.top    = (rect.top  - pad) + 'px';
      sp.style.left   = (rect.left - pad) + 'px';
      sp.style.width  = (rect.width  + pad * 2) + 'px';
      sp.style.height = (rect.height + pad * 2) + 'px';
      sp.style.display = 'block';

      // Scroll target into view smoothly
      document.getElementById(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      positionCard(rect, step.pos);
    }
  } else {
    sp.style.display = 'none';
    positionCard(null, 'center');
  }
}

function nextStep() {
  const STEPS = getSteps();
  if (currentStep >= STEPS.length - 1) {
    endTutorial();
    return;
  }
  currentStep++;
  showStep(currentStep);
}

function endTutorial() {
  getTutorialWrap().classList.add('hidden');
  localStorage.setItem('ugnai_tutorial_seen', '1');
}

function initTutorial() {
  if (localStorage.getItem('ugnai_tutorial_seen')) {
    getTutorialWrap().classList.add('hidden');
    return;
  }
  
  // Check if language has been chosen - if not, show language picker first
  const langChosen = localStorage.getItem('ugnai_site_lang');
  if (!langChosen) {
    // Show language picker first, tutorial will start after language is chosen
    getTutorialWrap().classList.add('hidden');
    showLangPickerBeforeTutorial();
    return;
  }

  // Show tutorial
  getTutorialWrap().classList.remove('hidden');
  showStep(0);

  document.getElementById('tut-next').addEventListener('click', nextStep);
  document.getElementById('tut-skip').addEventListener('click', endTutorial);

  // Reposition on resize
  window.addEventListener('resize', () => {
    if (!getTutorialWrap().classList.contains('hidden')) {
      showStep(currentStep);
    }
  });
}

// Show language picker before tutorial starts
function showLangPickerBeforeTutorial() {
  const picker = document.getElementById('lang-picker');
  if (!picker) return;
  
  picker.classList.remove('hidden');
  
  // Handle language selection - then start tutorial
  const handleLangSelect = (lang) => {
    const newLang = lang === 'English' ? 'english' : 'tagalog';
    localStorage.setItem('ugnai_site_lang', newLang);
    
    // Update the global siteLang variable in app.js
    if (typeof siteLang !== 'undefined') {
      siteLang = newLang;
    }
    
    picker.classList.add('hidden');
    
    // Apply translations if the function exists in app.js
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }
    
    // Now show the tutorial
    getTutorialWrap().classList.remove('hidden');
    showStep(0);
    
    // Setup tutorial event listeners
    document.getElementById('tut-next').addEventListener('click', nextStep);
    document.getElementById('tut-skip').addEventListener('click', endTutorial);
    
    // Reposition on resize
    window.addEventListener('resize', () => {
      if (!getTutorialWrap().classList.contains('hidden')) {
        showStep(currentStep);
      }
    });
  };
  
  // Attach handlers to language buttons
  document.querySelectorAll('.langpick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleLangSelect(btn.dataset.lang);
    });
  });
  
  // Skip button defaults to Tagalog
  const skipBtn = document.querySelector('.langpick-skip');
  skipBtn?.addEventListener('click', () => {
    handleLangSelect('Filipino');
  });
}

// Wait for fonts + layout to settle before positioning
window.addEventListener('load', () => setTimeout(initTutorial, 300));
