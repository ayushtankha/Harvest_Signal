import { describe, expect, it } from "vitest";
import { categoryStats, opportunities, type FeedbackRecord } from "./opportunity";
import { decide, DEFAULT_THRESHOLDS } from "./classifier";
import { CATEGORIES, type Category } from "./taxonomy";

const now = Date.UTC(2026, 9, 1);
const rec = (sessionId: string, label: FeedbackRecord["label"], extra: Partial<FeedbackRecord> = {}): FeedbackRecord => ({
  id: Math.random().toString(), sessionId, label, score: 0.9, secondCategory: "meals", second: 0.8,
  language: "en", inputMode: "text", ts: now - 1000, ...extra,
});
const opp = (r: FeedbackRecord[]) => opportunities(categoryStats(r, now, 90));

describe("opportunity trigger", () => {
  it("1 submission does not trigger", () => expect(opp([rec("a", "harvest_walk")])).toHaveLength(0));
  it("2 submissions do not trigger", () =>
    expect(opp([rec("a", "harvest_walk"), rec("b", "harvest_walk")])).toHaveLength(0));
  it("3 separate submissions trigger", () => {
    const o = opp([rec("a", "harvest_walk", { language: "en" }), rec("b", "harvest_walk", { language: "fr" }), rec("c", "harvest_walk", { language: "de" })]);
    expect(o).toHaveLength(1);
    expect(o[0]!.category).toBe("harvest_walk");
    expect(o[0]!.languages.sort()).toEqual(["de", "en", "fr"]);
  });
  it("same anonymous session repeated does not inflate count", () =>
    expect(opp([rec("a", "harvest_walk"), rec("a", "harvest_walk"), rec("a", "harvest_walk")])).toHaveLength(0));
  it("not-sure submissions never count", () =>
    expect(opp([rec("a", "not_sure"), rec("b", "not_sure"), rec("c", "not_sure")])).toHaveLength(0));
  it("submissions older than the 90-day window are ignored", () =>
    expect(opp([rec("a", "meals", { ts: now - 91 * 86_400_000 }), rec("b", "meals"), rec("c", "meals")])).toHaveLength(0));
});

const scores = (best: number, second: number) => {
  const s = Object.fromEntries(CATEGORIES.map((c) => [c, 0.5])) as Record<Category, number>;
  s.harvest_walk = best; s.meals = second; return s;
};

describe("not-sure rule", () => {
  it("low similarity → not sure", () => expect(decide(scores(0.7, 0.6), DEFAULT_THRESHOLDS).label).toBe("not_sure"));
  it("too-close top two → not sure", () => expect(decide(scores(0.9, 0.895), DEFAULT_THRESHOLDS).label).toBe("not_sure"));
  it("clear winner → category", () => expect(decide(scores(0.9, 0.85), DEFAULT_THRESHOLDS).label).toBe("harvest_walk"));
});
