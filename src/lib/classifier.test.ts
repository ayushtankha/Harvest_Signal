import { describe, expect, it } from "vitest";
import { decide, DEFAULT_THRESHOLDS } from "./classifier";
import { CATEGORIES, type Category } from "./taxonomy";

const scores = (s: Partial<Record<Category, number>>) =>
  Object.fromEntries(CATEGORIES.map((c) => [c, s[c] ?? 0.5])) as Record<Category, number>;

describe("not-sure guardrail", () => {
  it("clear high score with margin → category", () => {
    expect(decide(scores({ harvest_walk: 0.94, roasting: 0.9 }), DEFAULT_THRESHOLDS).label).toBe("harvest_walk");
  });
  it("best score below minScore (0.84) → Not sure", () => {
    expect(decide(scores({ harvest_walk: 0.83, roasting: 0.7 }), DEFAULT_THRESHOLDS).label).toBe("not_sure");
  });
  it("top-two margin below minMargin (0.012) → Not sure", () => {
    // real model output for the ambiguous demo message
    expect(decide(scores({ coffee_tasting: 0.846, transport: 0.843 }), DEFAULT_THRESHOLDS).label).toBe("not_sure");
  });
});
