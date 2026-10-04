# Smaller core download + optional voice pack

The look, sorting logic, thresholds, prototypes and "Not sure" stay exactly as they are. Measurements are taken from the real build; nothing is estimated.

Note: this reverses yesterday's change. Voice was being downloaded at startup, and now it becomes an optional pack you install by hand.

## What you will see
- **Home / ready tick**: "Ready for airplane mode" depends only on the text app: pages saved, text AI saved, AI engine saved, storage working. A missing voice pack never makes it look unready.
- **Settings**:
  - "Text classification: Installed".
  - "Voice input: Installed / Not installed".
  - An **"Install voice input for offline use (X MB)"** button, active only online, with a progress bar. X is the measured size of the voice files.
  - A **"Remove voice pack"** button. It removes only the voice files, never the text AI, pages or saved records.
  - Offline proof gains "Voice offline: Ready" or "Voice offline: Optional pack not installed".
- **Visitor page**: without the pack, the Speak button is disabled with the message "Voice input is not installed on this device. Use typing, or install the voice pack while connected to Wi-Fi." Typing always works. No online fallback.

## Steps
1. **Size audit first** (before any change): build for production and list every file with its normal and compressed size. Files are grouped (app code, CSS, HTML, classifier, tokenizer, speech model, speech config, engine JS, engine WASM, service worker, tests/eval, source maps, duplicates, other). The audit covers totals, what the offline helper saves, what the AI saves at runtime, core vs voice size, the 20 largest files and any duplicates.
2. **Classifier format check**: read the ONNX file and report its exact number format (expected 8-bit quantized), and confirm only one variant ships. No conversion.
3. **Remove non-production files** from the build and the offline save: source maps, tests and the evaluation set (kept for development tests only), unused files. Whisper config files currently in `public/models/whisper-tiny` stop being part of the mandatory save.
4. **Voice pack**: speech files are downloaded only when the user presses Install. They are checked after download (all files present, expected sizes) and only then marked installed. Remove deletes just those cache entries.
5. **Offline helper**: the mandatory save covers pages + text AI + tokenizer + engine only. The `/models/Xenova/whisper-tiny/` paths and the whisper decoder asset are excluded from the automatic save.
6. **AI engine packaging**: confirm the app uses only the WASM path. Check whether the WebGPU (JSEP) file can be swapped for the plain WASM-only engine file. Keep it only if classification still gives identical results in the browser; otherwise revert and document why. The engine version stays at whatever the AI library requires (currently 1.31.0-dev, pinned by @huggingface/transformers 4.3.0). It will be pinned exactly in package.json and the reason documented.
7. **Lazy-load** only the voice-install code and the diagnostics. Core pages stay fully saved before airplane mode.
8. **README**: a new "Installation size and offline packs" section with the measured core size, voice-pack size, total with voice, classifier format, engine version and the list of mandatory offline files. It uses your wording, and makes no weak-connection claim unless the numbers support it.
9. **Validate**: all tests plus the evaluation test, the production build, a check of the offline file list, and a test-browser pass with the network off covering every page, text classification, 3 submissions → opportunity, "Not sure", reload persistence, text working without the voice pack, voice removal not affecting the core app, no network requests after install, and no voice files in the first download.
10. **Final report** with the 12 items you listed. Anything I can only prove on the published site or your phone is named as such.

## Technical details
- Voice pack lives in a separate Cache Storage bucket (`harvestsignal-voice-v1`); install = fetch each whisper file (encoder, decoder asset, configs, tokenizer) → verify byte length → put into cache → write a "voice-installed" marker. `ai-worker.ts` `localFetch` reads whisper paths only from that bucket, and refuses network for them unless an install is in progress.
- `__root.tsx`: stop calling `loadSttModel()` at startup; `visitor.tsx`: call it only if the pack is installed.
- `hs.tsx` / `useOfflineReady`: ready = SW control + app cache files > 0 + embed ready + IndexedDB present; voice status shown separately.
- `public/sw.js`: model route stays cache-first, but the SW never fetches/caches whisper paths itself (the worker does, into the voice bucket).
- `vite.config.ts`: ensure `build.sourcemap` off; confirm eval/test files aren't in the client bundle (eval-set imported only by tests).
- Size audit script in /tmp reading the build output dir + asset JSON sizes; results are pasted into the README.
- If the production build output can't be served locally (Worker format), the cache-manifest check runs against the dev server, and the published-site check is listed as pending.
