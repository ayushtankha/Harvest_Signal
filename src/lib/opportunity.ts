import { CATEGORIES, type Category, type VisitorLang } from "./taxonomy";
import type { Label } from "./classifier";

export interface FeedbackRecord {
  id: string;
  sessionId: string;
  label: Label;
  score: number;
  secondCategory: Category;
  second: number;
  language: VisitorLang;
  inputMode: "text" | "voice";
  ts: number;
}

export const OPPORTUNITY_MIN = 3;
export const DAY = 86_400_000;

export interface CategoryStat {
  category: Category;
  /** distinct anonymous sessions in the window */
  count: number;
  avgScore: number;
  languages: VisitorLang[];
  lastTs: number;
}

/** Counts distinct anonymous sessions per category in the season window. */
export function categoryStats(records: FeedbackRecord[], now: number, windowDays: number): Record<Category, CategoryStat> {
  const from = now - windowDays * DAY;
  const out = {} as Record<Category, CategoryStat>;
  for (const c of CATEGORIES) {
    const recs = records.filter((r) => r.label === c && r.ts >= from && r.ts <= now);
    const bySession = new Map<string, FeedbackRecord>();
    for (const r of recs) if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, r);
    const uniq = [...bySession.values()];
    out[c] = {
      category: c,
      count: uniq.length,
      avgScore: uniq.length ? uniq.reduce((s, r) => s + r.score, 0) / uniq.length : 0,
      languages: [...new Set(uniq.map((r) => r.language))],
      lastTs: uniq.reduce((m, r) => Math.max(m, r.ts), 0),
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
