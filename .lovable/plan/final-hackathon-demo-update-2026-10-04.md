# Final hackathon demo update

No redesign, no new screens, no cloud, no voice output. The look, pages, storage, classification and offline saving stay as they are. Your brief stops mid-sentence at "9. Truthful claims and scope — Do not". I'll do the audit described in that section's first sentence and nothing more.

## What is already in place (checked)
- Noor's Albanian "Nuk ka mjaft të dhëna — pyet një vizitor." text exists, and the ambiguous demo message gives "Not sure" through the real thresholds.
- The Demo screen already has the 3 harvest messages (EN/FR/DE) and the ambiguous message. Noor's opportunity card already has Create Tour / Edit / Dismiss, and the tour uses the fixed template.
- No "read aloud / Noor hears / voice response / heard in Albanian" wording was found in the app or README. I'll do one more full search, including the demo instructions.

## Changes
1. **Wording audit**: visitor voice is input only, in EN/FR/DE. It is turned into text on the device. Noor's text is shown in Albanian or English. Replace any unsupported claim with that wording.
2. **Installation and model size**: add a README section plus one line in Settings → Offline proof. The first install is about 209 MB, downloaded once over Wi-Fi or side-loaded. Text-only mode uses about 135 MB. Speech adds about 45 MB. The intended device is a shared farm tablet or phone. Not meant for a weak connection.
3. **Separate evaluation set**: about 42 new messages (EN/FR/DE, all 7 categories, plus ambiguous, multi-intent and off-topic messages that should give "Not sure"). They go in their own file, marked as synthetic, and none are copied from the training or demo messages. A script runs the real on-device model and prints accuracy overall, by language and by category, the Not-sure rate, the correct-rejection rate, the confidently-wrong count and a list of wrong answers. I'll run it in the test browser. The README shows only real numbers, or "Not run yet". Thresholds stay unchanged.
4. **Problem evidence**: a README section with clear TODO placeholders for 2–3 figures (statistic, country, year, source, link). I won't invent any figures. Includes the link to the Tourism challenge.
5. **Why Albanian**: add your paragraph word for word. It makes no claim that the model was trained in Albanian.
6. **AI engine version**: the project uses onnxruntime-web 1.31.0-dev. It is not chosen by the app: the AI library (@huggingface/transformers 4.3.0) pins it exactly. Swapping in a stable version would mismatch that library and risk breaking offline loading. So I'll keep it, pin the AI library exactly (4.3.0, no ^), and explain why in a README "Technical stack" section.
7. **Demo screen**: add a status line for "Ready for airplane mode" with the saved-file count. It only shows Ready when the offline helper controls the page and the files are saved. The demo buttons stay labelled EN / FR / DE / ambiguous and go through the real classifier. No logic is forced.
8. **Offline proof additions**: an online/offline line, "IndexedDB available: yes/no", and the overall Ready line based on the same check as the home screen. Classifier, speech model, offline helper and file count are already there.
9. **Voice honesty**: add to the README and Demo notes: "Typing is the guaranteed offline input path. Voice is demonstrated only after successful validation on the demo device." Voice stays available, with no online fallback.
10. **Manual demo checklist**: add your 20 steps to the README, replacing the current A–L list.

## Technical details
- New `src/lib/eval-set.ts` (records: id, lang, text, expected, expectNotSure, source). The pure metrics function goes in `src/lib/evaluate.ts`, with a unit test using fake predictions. The real run is a Playwright script in /tmp that drives the worker in the dev server, and its output is pasted into the README.
- `package.json`: `"@huggingface/transformers": "4.3.0"`; lockfile updated; tests rerun.
- `src/routes/demo.tsx`, `src/routes/settings.tsx`: small text/status additions reusing `useOfflineReady`, `useAI`, `useOnline`.
