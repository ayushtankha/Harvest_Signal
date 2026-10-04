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

**Typing is the guaranteed offline input path. Voice is demonstrated only after successful validation on the demo device** (target: 10 consecutive real-device tests in airplane mode; not yet done). There is no online speech fallback.

## Installation and model size
- The complete first-time installation is approximately **209 MB** (text classifier ≈ 135 MB, speech ≈ 45 MB, AI engine ≈ 28 MB, plus app files).
- It is downloaded **once** by a guide or cooperative over Wi-Fi, or side-loaded onto the shared device. It is **not** intended to be downloaded over a weak mobile connection.
- After installation and caching, the core workflow runs offline.
- Text-only use relies on the ≈ 135 MB multilingual classifier; speech support accounts for the additional files.
- The intended device is a **shared tablet or smartphone kept at the farm**, not Noor's basic phone.

## Technical stack
- TanStack Start + React 19, Vite, Tailwind CSS v4.
- `@huggingface/transformers` **4.3.0** (pinned exactly).
- `onnxruntime-web` **1.31.0-dev.20260914-8d85527a0**. This development build is not chosen by the app: `@huggingface/transformers` 4.3.0 pins this exact version as its own dependency. Replacing it with an older stable release would mismatch the library's expected engine and risk breaking model loading and offline inference, so it is kept as resolved.
- IndexedDB (`idb`) for local records; Cache Storage + service worker for offline files.

## Problem evidence
> TODO — fill in with verified figures only. No figures below are real yet.

| Statistic | Country | Year | Source name | Source link |
|---|---|---|---|---|
| TODO | TODO | TODO | TODO | TODO |
| TODO | TODO | TODO | TODO | TODO |
| TODO | TODO | TODO | TODO | TODO |

Link to the Tourism challenge:
- Small tourism operators need to understand what visitors valued.
- Multilingual feedback is hard to combine manually.
- Weak connectivity limits cloud-based tools.
- Repeated visitor demand can help shape a new tourism experience.

## Why Albanian
Albanian is used as the prototype operator language because it reflects the team's localization perspective and demonstrates that the operator interface can be separated from visitor input languages. The interface uses a replaceable language file, so another deployment can substitute the operator's local language without changing the classification workflow.

The classifier was not trained or fine-tuned in Albanian; Albanian is only the language of Noor's fixed interface text, and the translations have not been checked by a native speaker.

## Evaluation
- Thresholds (`minScore 0.84`, `minMargin 0.012`) were originally tuned on a small demo set.
- A **separate** evaluation set of 40 synthetic messages lives in `src/lib/eval-set.ts` (EN 14 / FR 13 / DE 13; all 7 categories; 12 ambiguous, multi-intent or off-topic messages that should give "Not sure"). A test checks that none of them appear in the prototypes or demo messages. Thresholds were **not** changed after running it.
- Metrics are computed by `src/lib/evaluate.ts` over predictions from the real on-device classifier (run in a headless Chromium browser against the dev server, 2026-10-04).

Results (actual run, default thresholds):

| Metric | Result |
|---|---|
| Total / correct | 40 / 31 |
| Overall accuracy | 77.5 % |
| By language | EN 11/14 · FR 12/13 · DE 8/13 |
| By category | Harvest walk 1/4 · Coffee tasting 3/4 · Roasting 3/4 · Meals 4/4 · Prices 4/4 · Transport 4/4 · Other 3/4 · Not sure 9/12 |
| "Not sure" rate | 37.5 % (15 of 40) |
| Correct rejection (ambiguous/off-topic) | 9/12 = 75 % |
| Confidently incorrect | 3 |

Errors (expected → predicted): hw-en-1, hw-de-1, hw-en-2 harvest walk → Not sure; ct-de-1 coffee tasting → Not sure; ro-fr-1 roasting → Not sure; ot-en-1 other → Not sure; ns-de-1 Not sure → coffee tasting; ns-de-2 Not sure → prices; ns-de-4 (off-topic "Ich suche eine Apotheke.") → coffee tasting.

Most errors are cautious "Not sure" answers; the 3 confident errors are all German. Harvest walk and coffee tasting are often close to each other. This set does not represent every accent, dialect, visitor expression or tourism context. **These results are prototype evidence, not a production performance guarantee.**

## Manual demo checklist (continuous real-phone recording)
1. Open the published app online.
2. Wait until "Ready for airplane mode" appears.
3. Show the service worker and cached-file status (Settings → Offline proof).
4. Enable airplane mode and disable Wi-Fi.
5. Open the Demo screen.
6. Submit the English harvest message.
7. Submit the French harvest message.
8. Submit the German harvest message.
9. Open Noor's dashboard.
10. Show Harvest walk = 3.
11. Show the opportunity card in Albanian.
12. Select Create Tour.
13. Show the fixed template and Edit/Dismiss controls.
14. Submit the ambiguous message.
15. Show "Not sure."
16. Show "Nuk ka mjaft të dhëna — pyet një vizitor."
17. Test one real voice message only if voice passed 10 consecutive tests.
18. Open Settings → Offline proof.
19. Close and reopen the app while still offline.
20. Confirm routes and saved records still work.

How offline works: on first online load the service worker reads the home page and every script, style and font it references (recursively), so every page's code is saved before the first offline navigation. The cache name is derived from the build's file list, so each publish replaces the old copy. If something is missing offline, the app shows "This part of the app isn't saved on this phone yet — open it once online" instead of a blank page.

Two separate safeguards: **Not sure** = the AI is uncertain about one message; **Not enough data — ask a visitor** = fewer than 3 submissions for a category.

## Tests
`bunx vitest run` — opportunity trigger (1/2/3 submissions, duplicate session, window), not-sure rules (low score, small margin), "Delete all data" clearing local storage, evaluation metrics, and evaluation-set separation. The evaluation numbers above come from the real model in a browser, not from these unit tests.
