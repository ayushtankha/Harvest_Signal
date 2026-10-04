import { describe, expect, it } from "vitest";
import { categoryStats, opportunities, sanitizeRecord, ALLOWED_FIELDS, type FeedbackRecord } from "./opportunity";
import { decide, DEFAULT_THRESHOLDS } from "./classifier";
import { CATEGORIES, type Category } from "./taxonomy";
import { T } from "./i18n";

const now = Date.UTC(2026, 9, 1);
let n = 0;
const rec = (label: FeedbackRecord["label"], extra: Partial<FeedbackRecord> = {}): FeedbackRecord => ({
  id: String(++n), ts: now - 1000, language: "en", inputMode: "text", label, accepted: label !== "not_sure",
  score: 0.9, secondCategory: "meals", second: 0.8, ...extra,
});
const opp = (r: FeedbackRecord[]) => opportunities(categoryStats(r, now, 90));

describe("opportunity trigger", () => {
  it("1 submission does not trigger", () => expect(opp([rec("harvest_walk")])).toHaveLength(0));
  it("2 submissions do not trigger", () => expect(opp([rec("harvest_walk"), rec("harvest_walk")])).toHaveLength(0));
  it("3 separate accepted submissions trigger", () => {
    const o = opp([rec("harvest_walk", { language: "en" }), rec("harvest_walk", { language: "fr" }), rec("harvest_walk", { language: "de" })]);
    expect(o).toHaveLength(1);
    expect(o[0]!.category).toBe("harvest_walk");
    expect(o[0]!.languages.sort()).toEqual(["de", "en", "fr"]);
  });
  it("evidence rows are the real stored records", () => {
    const rs = [rec("meals", { score: 0.91 }), rec("meals", { score: 0.88 }), rec("meals", { score: 0.87 })];
    const o = opp(rs);
    expect(o[0]!.records.map((r) => r.id).sort()).toEqual(rs.map((r) => r.id).sort());
    expect(o[0]!.records.map((r) => r.score).sort()).toEqual([0.87, 0.88, 0.91]);
  });
  it("not-sure submissions never count", () =>
    expect(opp([rec("not_sure"), rec("not_sure"), rec("not_sure")])).toHaveLength(0));
  it("submissions older than the 90-day window are ignored", () =>
    expect(opp([rec("meals", { ts: now - 91 * 86_400_000 }), rec("meals"), rec("meals")])).toHaveLength(0));
});

describe("stored record privacy", () => {
  it("legacy records are sanitized to permitted metadata only", () => {
    const legacy = { id: "x", ts: 1, label: "meals", sessionId: "s1", text: "secret words", transcript: "t", audio: [1, 2], name: "Ana", score: 0.9, language: "fr", inputMode: "voice", secondCategory: "prices", second: 0.8 };
    const clean = sanitizeRecord(legacy)!;
    expect(Object.keys(clean).sort()).toEqual([...ALLOWED_FIELDS].sort());
    expect(JSON.stringify(clean)).not.toContain("secret");
    expect(clean.accepted).toBe(true);
  });
  it("legacy not-sure record becomes not accepted", () =>
    expect(sanitizeRecord({ id: "y", ts: 1, label: "not_sure" })!.accepted).toBe(false));
});

describe("score wording", () => {
  it('uses "similarity score", never "confidence"', () => {
    expect(T.en.similarity).toBe("Similarity score");
    for (const l of ["en", "sq"] as const) expect(JSON.stringify(T[l]).toLowerCase()).not.toContain("confidence");
  });
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
