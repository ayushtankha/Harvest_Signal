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
   - Voice-to-text check: one quick try with a fake microphone file in the headless browser. If it gets fiddly I drop it. The real test is on your phone (step 7).

6. **Smaller speech model download**
   - Look at every Whisper-tiny variant and use the smallest quantized setup that works reliably in the browser.
   - Report the real total download size for speech and for the classifier, counting every file and not just the largest one.

7. **Honest wording: "submissions", not "visitors"**
   - Change Noor's text, the README and comments from "3 separate visitors" to "3 separate visitor submissions". A random session ID can't prove the submissions came from 3 different people.
   - Keep the two safeguards separate on screen and in the demo: "Not sure" when the AI is uncertain, and "Not enough data — ask a visitor" when there are only 1–2 requests.

## Final acceptance test (on your phone)
Open the published app once online, wait for the downloads to finish, turn on airplane mode, then speak a request in EN, FR and DE on a real phone microphone. Each one should show a local transcript, get classified, and together they should trigger the opportunity.

5. **README**
   - Add a clear section: voice is input only, turned into text on the device; Noor gets text; no text-to-speech; no ElevenLabs, Anthropic or Bright Data at runtime; model sizes and licenses (E5 MIT, Whisper-tiny Apache-2.0, ONNX Runtime MIT); airplane-mode steps.

## Technical details
- Files: `src/routes/visitor.tsx` (unavailable state), `src/lib/taxonomy.ts` (AMBIGUOUS_DEMO), `src/routes/demo.tsx`, `src/lib/classifier.test.ts` (new), `src/lib/db.test.ts` (new, `fake-indexeddb` dev dependency), README.md.
- Speech model stays isolated behind `src/lib/speech.ts`; the UI imports only from there.
- Thresholds stay as they are unless the ambiguous search shows they need a small adjustment; any change gets documented.
