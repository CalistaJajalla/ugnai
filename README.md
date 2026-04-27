# UGNai — Unified Guro Narrative AI

AI communication tool for Filipino public school teachers.

## Setup

### 1. Clone & deploy to Vercel

```bash
git clone https://github.com/YOUR_USERNAME/ugnai.git
cd ugnai
vercel
```

### 2. Add your API key to Vercel (one-time, done in the dashboard)

1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
4. Redeploy once

Users never see or touch this key. It lives only on Vercel's servers.

### 3. Install on phone (no Play Store needed)

Android: Open site in Chrome → three-dot menu → "Add to Home Screen"
iPhone: Open in Safari → Share → "Add to Home Screen"

### 4. Add app icons

Create two PNG files and put them in the `icons/` folder:
- `icons/icon-192.png` (192×192 px)
- `icons/icon-512.png` (512×512 px)

## Project structure

```
ugnai/
├── index.html        — App UI
├── style.css         — Styles  
├── app.js            — App logic
├── api/
│   └── generate.js   — Vercel serverless function (holds API key securely)
├── sw.js             — Service worker (PWA)
├── manifest.json     — PWA manifest
├── icons/            — App icons (add your PNGs here)
└── vercel.json       — Vercel config
```

## Play Store

UGNai is a PWA — teachers install it from the browser for free.
If you later want Google Play, one-time fee is $25 USD.
