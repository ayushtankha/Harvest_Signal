# HarvestSignal

Offline-first Small AI prototype — World Bank × Hack-Nation "Small AI for Development", Tourism track.

## Problem & user
Noor runs a small coffee farm that receives a few foreign visitors. Language barriers and weak connectivity mean she never learns what visitors actually wanted. HarvestSignal lets visitors leave short feedback (voice or text, EN/FR/DE); the phone sorts it locally into fixed tourism categories and tells Noor — in her local language (prototype localization: **Albanian**) — when at least 3 separate visitors want the same thing. **The AI only informs; Noor decides.** Nothing is published, sent or booked automatically.

## Why AI
Visitors phrase the same wish in many ways and languages ("see the harvest", "voir la récolte", "Ernte sehen"). A multilingual sentence-embedding model maps them to one meaning without translation or an internet connection.

## Architecture
```text
voice ─► MediaRecorder ─► 16 kHz PCM ─► Whisper-tiny (local) ─┐
text  ───────────────────────────────────────────────────────┴─► "query: " + text
   ─► multilingual-e5-small (local, Web Worker) ─► cosine vs synthetic prototypes
   ─► per-category mean(top-3) ─► minScore + minMargin rule ─► category | NOT SURE
   ─► IndexedDB (anonymous record) ─► ≥3 distinct sessions in season window ─► Opportunity
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

## Models
| Model | Use | Size (quantized) | License |
|---|---|---|---|
| Xenova/multilingual-e5-small (ONNX q8) | text classification | ~118 MB + 17 MB tokenizer | MIT |
| Xenova/whisper-tiny (ONNX q8) | offline speech-to-text | ~41 MB | Apache-2.0 |
| ONNX Runtime Web (WASM) | inference engine | ~28 MB | MIT |

No model was trained. First load downloads ~200 MB once; afterwards no network is needed.

## Data
- **Prototype examples are synthetic**, hand-written: 4 per language × 3 languages = 12 per category (`taxonomy.ts`).
- No public dataset was used. **Real farm-visit messages are not represented.**
- Not covered: slang, mixed-language messages, low-resource languages, noisy audio. Accuracy may drop outside EN/FR/DE.
- Calibration (demo set, on-device): EN/FR/DE harvest sentences → Harvest walk with scores 0.93–0.95 and margins 0.018–0.026; an unrelated message → Other. Defaults: `minScore 0.84`, `minMargin 0.012`. This is a tiny set — recalibrate with real data.
- The app says **"Not sure"** rather than guessing.

## Privacy
Stored per submission: random ID, random anonymous session ID, category, top-2 scores, language, input mode, timestamp. **No raw text, no audio, no names or contacts.** Repeated submissions from one session count once. "Delete all data" wipes everything; optional PIN protects Settings. Lost device: data only exists on that device, no cloud copy. Speaker identity is never inferred.

## Guardrails
Fixed taxonomy only · not-sure on low score or small margin · evidence shown as counts, average similarity and languages (no invented confidence labels) · tour drafts come from fixed templates · human always decides.

## Known limitations
Whisper-tiny is weak in noise and on cheap phones; voice is optional and text always works. First load is large. iOS may evict caches when storage is low.

## Airplane-mode test
1. Open the published app online; wait for the ✓ next to the chip icon (and 🎙 100% on the Visitor screen).
2. Settings → Offline proof: model files cached, service worker active.
3. Enable airplane mode, reload the app.
4. Demo → "3 harvest messages" → Open Noor: Harvest walk = 3, opportunity card in Albanian → Create Tour.
5. Demo → Reset → "1 unrelated message" → Noor shows "Nuk ka mjaft të dhëna — pyet një vizitor."

## Tests
`bunx vitest run` — opportunity trigger (1/2/3 submissions, duplicate session, window) and not-sure rules. Multilingual classification and offline behaviour are verified in a real browser with the network disabled.
