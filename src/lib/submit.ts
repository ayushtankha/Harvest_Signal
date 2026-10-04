import { classifyText } from "./ai";
import { addFeedback, getSettings } from "./db";
import type { FeedbackRecord } from "./opportunity";
import type { Category, VisitorLang } from "./taxonomy";

/** In-memory only: categories already counted for the current visitor session.
 *  Never stored, so nothing persistent links submissions together. */
export type VisitorSession = Set<Category>;
export const newSession = (): VisitorSession => new Set();

/** Build the stored record. Only permitted metadata — the text is not passed in. */
export function buildRecord(
  r: { label: FeedbackRecord["label"]; best: number; secondCategory: Category; second: number },
  language: VisitorLang,
  inputMode: "text" | "voice",
  ts = Date.now(),
): FeedbackRecord {
  return {
    id: crypto.randomUUID(),
    ts,
    language,
    inputMode,
    label: r.label,
    accepted: r.label !== "not_sure",
    score: r.best,
    secondCategory: r.secondCategory,
    second: r.second,
  };
}

/** Classify locally, then store metadata only. The text stays in memory and is dropped.
 *  A repeat of an already-counted category within the same visitor session is not stored again. */
export async function submitFeedback(text: string, language: VisitorLang, session: VisitorSession, inputMode: "text" | "voice") {
  const s = await getSettings();
  const r = await classifyText(text, s);
  const rec = buildRecord(r, language, inputMode);
  const repeat = rec.label !== "not_sure" && session.has(rec.label);
  if (!repeat) {
    await addFeedback(rec);
    if (rec.label !== "not_sure") session.add(rec.label);
  }
  return { rec, result: r, repeat };
}
