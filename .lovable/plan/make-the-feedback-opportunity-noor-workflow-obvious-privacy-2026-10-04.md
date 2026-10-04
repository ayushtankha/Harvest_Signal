# Make the feedback → opportunity → Noor workflow obvious (privacy kept)

No new AI model, no voice output, no cloud, no redesign. The classifier, thresholds and "Not sure" behaviour stay exactly as they are.

Note: part of your answer reached me cut off (the middle, roughly sections 3–8). This plan covers everything I could read. Please paste anything from those sections that isn't reflected below.

## 1. Clear three-state wording on Noor's dashboard
- **Opportunity detected**: 3 or more separate visitor submissions in the same category within the season window.
- **Not enough data — ask a visitor**: no category has 3 valid submissions yet. Categories with 1–2 show "1 of 3" / "2 of 3".
- **Not sure**: the AI wasn't confident about that one message. It is shown as its own count with a short note that it never counts toward an opportunity.
- Fix the Albanian opportunity sentence, which currently says "N vizitorë" (N visitors), to talk about separate submissions instead. It will be marked for native-speaker review.

## 2. Opportunity card and detail
- A suggested opportunity line in fixed text, for example "Visitors are interested in a coffee tasting experience." (one per category, in EN and Albanian).
- The number of separate submissions supporting it.
- An expandable **"Why this opportunity?"** section that works with the keyboard and screen readers:
  - Heading: "3 anonymous submissions matched 'Harvest walk'."
  - One row per supporting submission: language · Voice/Text · date · category · Similarity 0.93.
  - A short explanation: "Similarity score shows how close the message was to examples of this category. It is not a probability." The word "confidence" is never used.
- Create Tour / Edit / Dismiss stay as they are. The tour stays a fixed template.

## 3. Stored record (local only, IndexedDB)
Saved per submission: random record ID, date/time, language, Voice/Text, matched label (category or Not sure), similarity score, second-best category and score (margin = difference), threshold result (Accepted / Not sure).
Not saved: message, transcript, audio, name, contact, location or any visitor or device identifier.
- The random per-session ID used to stop one session counting twice will no longer be saved. Repeat taps within one visitor session are blocked in memory instead, so nothing persistent links submissions.
- Older records: a one-time clean-up when the app opens strips any extra fields, keeping only the allowed ones. It won't crash on records that are missing fields.
- Text and audio are only held in memory during classification and are never logged.

## 4. Tests
- Records contain only the allowed fields (no text, transcript, audio or session ID).
- Evidence rows come from real stored records.
- 3 accepted submissions create an opportunity; "Not sure" submissions never do.
- Delete all data removes records, dismissals and drafts, but leaves the saved offline app and AI files in place.
- The old-record clean-up strips forbidden fields.
- The "Similarity score" label is used and the word "confidence" never appears in the interface text.
- Run all tests and check in the browser: demo flow, Noor's evidence rows, and the stored records inspected directly.

## 5. Report afterwards
Changed files, final record structure, clean-up behaviour, test results, final English wording, new Albanian strings needing review, and any privacy claim I couldn't verify.

## Technical details
- `src/lib/opportunity.ts`: `FeedbackRecord` drops `sessionId`, adds `accepted: boolean`. Counting uses each accepted record as one separate submission. `submit.ts` keeps an in-memory set of the current visitor's already-counted categories, so repeat taps in one session are ignored.
- `src/lib/db.ts`: `sanitizeRecord()` whitelist plus a one-time migration in the DB upgrade or on open.
- `src/lib/i18n.ts`: new keys (`whyOpp`, `matched`, `similarity`, `simExplain`, `suggest[cat]`, `notSureNote`, `progress`), with Albanian marked `// TODO native review`.
- `noor.index.tsx`, `noor.opportunity.$category.tsx`: evidence panel using `<details>`/`<summary>`.
- Tests in `opportunity.test.ts` and `db.test.ts` (fake-indexeddb).
