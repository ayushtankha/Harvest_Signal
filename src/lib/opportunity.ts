import { CATEGORIES, type Category, type VisitorLang } from "./taxonomy";
import type { Label } from "./classifier";

/** Stored per submission — structured metadata only. Never visitor words,
 *  transcripts, audio, names, contacts, or any visitor/device identifier. */
export interface FeedbackRecord {
  id: string;
  ts: number;
  language: VisitorLang;
  inputMode: "text" | "voice";
  /** matched category, or "not_sure" when the threshold rule rejected it */
  label: Label;
  /** true = Accepted by minScore + minMargin; false = Not sure */
  accepted: boolean;
  /** similarity score of the best category (not a probability) */
  score: number;
  secondCategory: Category;
  second: number;
}

export const ALLOWED_FIELDS = ["id", "ts", "language", "inputMode", "label", "accepted", "score", "secondCategory", "second"] as const;

/** Whitelist a (possibly legacy) record down to the permitted metadata. */
export function sanitizeRecord(raw: Record<string, unknown>): FeedbackRecord | null {
  if (typeof raw.id !== "string" || typeof raw.ts !== "number" || typeof raw.label !== "string") return null;
  return {
    id: raw.id,
    ts: raw.ts,
    language: (["en", "fr", "de"].includes(raw.language as string) ? raw.language : "en") as VisitorLang,
    inputMode: raw.inputMode === "voice" ? "voice" : "text",
    label: raw.label as Label,
    accepted: typeof raw.accepted === "boolean" ? raw.accepted : raw.label !== "not_sure",
    score: typeof raw.score === "number" ? raw.score : 0,
    secondCategory: (raw.secondCategory as Category) ?? "other",
    second: typeof raw.second === "number" ? raw.second : 0,
  };
}

export const OPPORTUNITY_MIN = 3;
export const DAY = 86_400_000;

export interface CategoryStat {
  category: Category;
  /** separate accepted visitor submissions in the window */
  count: number;
  avgScore: number;
  languages: VisitorLang[];
  lastTs: number;
  /** the supporting records (evidence) */
  records: FeedbackRecord[];
}

/** Counts accepted submissions per category in the season window. "Not sure" never counts. */
export function categoryStats(records: FeedbackRecord[], now: number, windowDays: number): Record<Category, CategoryStat> {
  const from = now - windowDays * DAY;
  const out = {} as Record<Category, CategoryStat>;
  for (const c of CATEGORIES) {
    const recs = records
      .filter((r) => r.label === c && r.accepted !== false && r.ts >= from && r.ts <= now)
      .sort((a, b) => a.ts - b.ts);
    out[c] = {
      category: c,
      count: recs.length,
      avgScore: recs.length ? recs.reduce((s, r) => s + r.score, 0) / recs.length : 0,
      languages: [...new Set(recs.map((r) => r.language))],
      lastTs: recs.reduce((m, r) => Math.max(m, r.ts), 0),
      records: recs,
    };
  }
  return out;
}

export function opportunities(
  stats: Record<Category, CategoryStat>,
  dismissed: Partial<Record<Category, number>> = {},
  min = OPPORTUNITY_MIN,
): CategoryStat[] {
  return Object.values(stats)
    .filter((s) => s.category !== "other" && s.count >= min)
    .filter((s) => !(dismissed[s.category] && dismissed[s.category]! >= s.lastTs))
    .sort((a, b) => b.count - a.count);
}
