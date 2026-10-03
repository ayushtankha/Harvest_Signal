# HarvestSignal refinement (no redesign)

Most of the brief already exists: voice and text both feed the same local classifier, Noor's screens are text-only in Albanian/English, opportunities need 3 separate anonymous visitors, and Create Tour uses fixed templates. This plan closes the remaining gaps without changing the look or adding features.

## Changes

1. **Voice really unavailable = shown clearly**
   - On the visitor screen, the microphone button shows a clear "Voice unavailable — please type" state if the speech model fails to load or the microphone is blocked. Typing always stays available. Nothing falls back to an online service.
   - Raw recording is dropped right after transcription (already true; worth one more check).

2. **Ambiguous demo message that actually gives "Not sure"**
   - Find one fixed message (e.g. a short mixed request) that scores below the threshold or with too small a gap, using the real model in the browser. Add it to the Demo screen as the "ambiguous" button, replacing the current unrelated one, which comes out as "Other".
   - Noor's dashboard shows "Not sure" / "Not enough data — ask a visitor" for it.

3. **Remove leftover audio playback**
   - Remove any recorded-voice or tone playback still in Noor's screens. Noor gets text only.

4. **Tests**
   - Add classifier tests: low score gives Not sure, small gap gives Not sure, and a clear score gives the right category.
   - Add a test that "Delete all data" really empties local storage (fake IndexedDB).
   - Keep the existing 1/2/3-submission and duplicate-session tests.
   - Check in the browser: EN/FR/DE harvest messages give Harvest walk, the ambiguous message gives Not sure, and no network requests happen offline.
   - Voice-to-text check: run a recorded EN harvest phrase through the local speech model in headless Chromium using a fake microphone file.

5. **README**
   - Add a clear section: voice is input only, turned into text on the device; Noor gets text; no text-to-speech; no ElevenLabs, Anthropic or Bright Data at runtime; model sizes and licenses (E5 MIT, Whisper-tiny Apache-2.0, ONNX Runtime MIT); airplane-mode steps.

## Technical details
- Files: `src/routes/visitor.tsx` (unavailable state), `src/lib/taxonomy.ts` (AMBIGUOUS_DEMO), `src/routes/demo.tsx`, `src/lib/classifier.test.ts` (new), `src/lib/db.test.ts` (new, `fake-indexeddb` dev dependency), README.md.
- Speech model stays isolated behind `src/lib/speech.ts`; the UI imports only from there.
- Thresholds stay as they are unless the ambiguous search shows they need a small adjustment; any change gets documented.
