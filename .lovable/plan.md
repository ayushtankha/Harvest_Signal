# HarvestSignal — offline feedback prototype

A phone-first app where visitors leave short feedback (EN/FR/DE), a small AI model running on the device sorts it into fixed categories, and Noor sees an "Opportunity" card once 3 visitors ask for the same thing. Everything works in airplane mode after the first load. No accounts, no server, no cloud AI.

## Screens
1. **Welcome** — big offline/model-ready status, two large buttons: "Visitor" and "Noor".
2. **Visitor** — header "Tell Noor what you loved or wanted to see.", EN / FR / DE language chips, large text box, example chips, Send. Mic button shown as "coming soon" (disabled). Big "Thank you" state afterwards.
3. **Noor dashboard** — offline banner ("Offline — core AI is working on this device"), season counts per category (counts only), opportunity cards, "Not enough data — ask a visitor." when nothing reaches 3.
4. **Opportunity detail** — "3 visitors asked about this", evidence (submission count, average similarity, languages detected), Play insight, Create Tour, Edit, Dismiss.
5. **Create Tour draft** — fixed editable template (title, duration, description, includes), status "Draft — review before offering", Save Draft, note "Nothing is published automatically."
6. **Settings / Privacy** — privacy text, Delete all data, optional PIN, edit category thresholds/names, offline proof panel (model loaded, service worker active, record count, cached version — all read from real browser state).
7. **Demo** — Reset demo, one-tap load of the three harvest example messages.

## Behaviour rules
- Categories fixed: harvest walk, coffee tasting, roasting, meals, prices, transport, other.
- Result is "not sure" if best score is below threshold OR gap to second category is too small. Never forced.
- Opportunity = at least 3 separate submissions in one category within the season window (default 90 days, editable).
- Nothing is ever published, sent or booked automatically.
- Stored per submission only: random ID, category, score, timestamp, language, top-2 scores. No names or contact details.

## Visual direction
Warm, earthy farm palette (deep coffee brown, cream, leaf green, harvest amber), large rounded serif headings with a sturdy sans body, oversized touch targets and icons, high contrast, very little text. No chatbot look.

## Audio
One local recording per category under the app's audio folder, cached for offline use. No text-to-speech. I can't record Noor's local language myself, so I'll ship short placeholder tones with the final filenames; you swap in real recordings later.

## Technical details
- Runs as a client-only app inside the existing TanStack Start setup (routes: /, /visitor, /noor, /noor/opportunity/$category, /noor/tour/$category, /settings, /demo). All AI/storage code runs in the browser only.
- Model: `Xenova/multilingual-e5-small` (quantized ONNX, ~118 MB, MIT license) downloaded once into `public/models/`; ONNX WASM runtime files copied into `public/` too. Transformers.js configured with `allowRemoteModels=false`, `allowLocalModels=true`, local wasm paths. Inference in a Web Worker so the UI stays responsive; visible loading progress.
- Classifier module (`src/lib/classifier.ts`): "query: " prefix, mean-pooled normalized embeddings, cosine vs. 8–15 synthetic prototypes per category per language, per-category score = mean of top-3 prototype similarities, configurable `minScore` and `minMargin`. Prototype embeddings computed once and cached in IndexedDB.
- Storage: IndexedDB (via `idb`) for feedback, dismissed opportunities, tour drafts, settings, PIN hash.
- Offline: service worker precaches app shell, model, wasm and audio. Registration guarded so it never runs inside the Lovable preview/iframe; it works on the published site. Offline proof panel reads `navigator.serviceWorker.controller`, Cache Storage contents and IndexedDB counts.
- Unit tests for classifier thresholds ("not sure" rules) and the 3-submission opportunity trigger.
- README covering problem, user, architecture, model/size/license, synthetic data disclosure and gaps (no real farm messages, no slang/mixed-language/low-resource languages), privacy, limitations, airplane-mode test steps.
- Note: the spec mentions Replit; this will be deployed via Lovable publishing, which is also static-friendly.

## Out of scope
Accounts, payments, maps, bookings, chat, cloud database, messaging integrations, translation, free-form AI text, speaker recognition.
