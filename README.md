# HarvestSignal

Offline-first Small AI prototype — World Bank × Hack-Nation "Small AI for Development", Tourism track.

## Problem & user
Noor runs a small coffee farm that receives a few foreign visitors. Language barriers and weak connectivity mean she never learns what visitors actually wanted. HarvestSignal lets visitors leave short feedback (voice or text, EN/FR/DE); the phone sorts it locally into fixed tourism categories and tells Noor — in her local language (prototype localization: **Albanian**) — when at least 3 separate anonymous visitor submissions ask for the same thing within the season window. A session ID prevents repeat submissions within one session from inflating the count; it does not identify or verify a real person. **The AI only informs; Noor decides.** Nothing is published, sent or booked automatically.

## Input and output
- **Voice is input only.** It is turned into text on the device (local Whisper-tiny), then follows exactly the same path as typed text.
- **Noor receives text only** (Albanian or English, fixed translations).
- No text-to-speech, no voice output, no voice-to-voice.
- No runtime dependency on ElevenLabs, Anthropic, Bright Data or any cloud service. No browser Web Speech API.
- If the speech model can't load or the microphone is blocked, the Visitor screen says "Voice unavailable on this device — please type". It never falls back to an online service.

## Why AI
Visitors phrase the same wish in many ways and languages ("see the harvest", "voir la récolte", "Ernte sehen"). A multilingual sentence-embedding model maps them to one meaning without translation or an internet connection.

## Architecture
```text
voice ─► MediaRecorder ─► 16 kHz PCM ─► Whisper-tiny (local) ─┐
text  ───────────────────────────────────────────────────────┴─► "query: " + text
   ─► multilingual-e5-small (local, Web Worker) ─► cosine vs synthetic prototypes
   ─► per-category mean(top-3) ─► minScore + minMargin rule ─► category | NOT SURE
   ─► IndexedDB (anonymous record) ─► ≥3 separate anonymous submissions (one per session) in season window ─► Opportunity
   ─► fixed Albanian/English text + fixed tour template ─► Noor reviews
```
- `src/lib/classifier.ts` — pure scoring + not-sure rule (thresholds editable in Settings)
- `src/lib/opportunity.ts` — distinct-session counting, season window, trigger
- `src/lib/ai-worker.ts` — on-device inference (Transformers.js + ONNX Runtime WASM)
- `src/lib/speech.ts` — voice adapter (offline STT), audio discarded after transcription
- `src/lib/taxonomy.ts` — fixed taxonomy + synthetic prototype examples
- `src/lib/i18n.ts` — fixed translations and tour templates (no generative AI)
- `public/sw.js` — service worker (published site only)

## Offline approach
- `allowRemoteModels = false`; model files are served from this app's own origin only. The worker blocks any non-local request.
- On first online load, model + engine files are stored in Cache Storage (`harvestsignal-models-v1`); prototype embeddings are cached in IndexedDB.
- The service worker caches pages and app code so the app opens in airplane mode. It is disabled in the editor preview and only runs on the published URL.
- No backend, no cloud AI, no accounts, no CDN.

## Models and runtime (actually shipped)
| Component | Version / variant | Use | Total download | License (checked at source) |
|---|---|---|---|---|
| Xenova/multilingual-e5-small | ONNX `model_quantized.onnx` (q8) + tokenizer | text classification | 135.4 MB (118.3 model + 17.1 tokenizer) | MIT (from intfloat/multilingual-e5-small model card; the Xenova ONNX conversion has no separate license tag) |
| Xenova/whisper-tiny | ONNX q8 encoder + q8 merged decoder + tokenizer/config | offline speech-to-text | 45.2 MB (10.1 encoder + 30.7 decoder + 4.4 tokenizer/config) | Apache-2.0 (Hugging Face model card) |
| onnxruntime-web | 1.31.0-dev, `ort-wasm-simd-threaded.jsep.wasm` | inference engine | 28.4 MB | MIT (npm package) |
| @huggingface/transformers | 4.3.0 (bundled in app code) | pipelines | in app bundle | Apache-2.0 (npm package) |

Whisper-tiny q8 is the smallest variant that runs reliably in the browser; total speech download is 45.2 MB. **Total first-load download ≈ 209 MB**, once; afterwards no network is needed. No model was trained or fine-tuned.

## Data
- **Prototype examples are synthetic**, hand-written: 4 per language × 3 languages = 12 per category (`taxonomy.ts`).
- No public dataset was used. **Real farm-visit messages are not represented.**
- Not covered: slang, mixed-language messages, low-resource languages, noisy audio. Accuracy may drop outside EN/FR/DE.
- Calibration (demo set, on-device): EN/FR/DE harvest sentences → Harvest walk with scores 0.93–0.95 and margins 0.018–0.026; an unrelated message → Other; the fixed ambiguous message "Can I pay by card for the coffee tasting and the taxi?" → Not sure (coffee tasting 0.846 vs transport 0.843, margin below 0.012). Defaults: `minScore 0.84`, `minMargin 0.012`. This is a tiny set — recalibrate with real data.
- The app says **"Not sure"** rather than guessing.

## Privacy
Stored per submission: random ID, random anonymous session ID, category, top-2 scores, language, input mode, timestamp. **No raw text, no audio, no names or contacts.** Repeated submissions from one session count once. "Delete all data" wipes everything; optional PIN protects Settings. Lost device: data only exists on that device, no cloud copy. Speaker identity is never inferred.

## Guardrails
Fixed taxonomy only · not-sure on low score or small margin · evidence shown as counts, average similarity and languages (no invented confidence labels) · tour drafts come from fixed templates · human always decides.

## Known limitations
Whisper-tiny is weak in noise and on cheap phones; voice is optional and text always works. First load is large. iOS may evict caches when storage is low.

## Airplane-mode test
Open the published app once online and keep Wi-Fi on until the screen says "Ready for airplane mode" (text AI and voice model saved, every page saved, and the service worker controls the page — the app reloads itself once if needed). Only then enable airplane mode, test navigation between all core routes, and speak one request each in EN, FR and DE on the Visitor page (allow the microphone once).

A. Open the PUBLISHED app online.
B. Wait for the ✓ next to the chip icon (and 🎙 100% on the Visitor screen).
C. Reload once.
D. Settings → Offline proof: "Service worker controls this page: yes", saved app files > 0, model files cached.
E. Turn on airplane mode.
F. Reload the page.
G. Tap Visitor.
H. Go back, tap Noor.
I. Open Settings.
J. Open Demo.
K. Demo → "3 harvest messages" → Open Noor: Harvest walk = 3, opportunity card in Albanian → Create Tour. Then Reset → "1 ambiguous message" → "Not sure"; Noor shows "Nuk ka mjaft të dhëna — pyet një vizitor."
L. Real phone voice: speak a harvest request in EN, FR and DE (fresh session each time). If offline voice works, each shows a local transcript and is classified; if not, the screen says voice is unavailable and typing remains the guaranteed offline path.

How it works: on first online load the service worker reads the home page and every script, style and font it references (recursively), so every page's code is saved before the first offline navigation. The cache name is derived from the build's file list, so each publish replaces the old copy. If something is missing offline, the app shows "This part of the app isn't saved on this phone yet — open it once online" instead of a blank page.

Two separate safeguards: **Not sure** = the AI is uncertain about one message; **Not enough data — ask a visitor** = fewer than 3 submissions for a category.

## Tests
`bunx vitest run` — opportunity trigger (1/2/3 submissions, duplicate session, window) not-sure rules (low score, small margin) and "Delete all data" clearing local storage. Multilingual classification and offline behaviour are verified in a real browser with the network disabled.
