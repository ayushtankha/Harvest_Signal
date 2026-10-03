import { classifyText } from "./ai";
import { addFeedback, getSettings } from "./db";
import type { FeedbackRecord } from "./opportunity";
import type { VisitorLang } from "./taxonomy";

/** Classify locally and store only the minimal record (no raw text, no identity). */
export async function submitFeedback(text: string, language: VisitorLang, sessionId: string, inputMode: "text" | "voice") {
  const s = await getSettings();
  const r = await classifyText(text, s);
  const rec: FeedbackRecord = {
    id: crypto.randomUUID(),
    sessionId,
    label: r.label,
    score: r.best,
    secondCategory: r.secondCategory,
    second: r.second,
    language,
    inputMode,
    ts: Date.now(),
  };
  await addFeedback(rec);
  return { rec, result: r };
}
