import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { EVAL_SET, type EvalRecord } from "./eval-set";
import { DEMO_MESSAGES, AMBIGUOUS_DEMO, prototypeList, CATEGORIES } from "./taxonomy";

const rec = (id: string, expected: EvalRecord["expected"]): EvalRecord =>
  ({ id, lang: "en", text: id, expected, expectNotSure: expected === null, source: "synthetic" });

describe("evaluate metrics", () => {
  it("counts correct, rejections and confidently wrong", () => {
    const r = evaluate([
      { record: rec("a", "meals"), predicted: "meals" },
      { record: rec("b", "meals"), predicted: "prices" },
      { record: rec("c", null), predicted: "not_sure" },
      { record: rec("d", null), predicted: "transport" },
    ]);
    expect(r.total).toBe(4);
    expect(r.correct).toBe(2);
    expect(r.accuracy).toBe(0.5);
    expect(r.correctRejections).toBe(1);
    expect(r.correctRejectionRate).toBe(0.5);
    expect(r.confidentlyWrong).toBe(2);
    expect(r.notSureRate).toBe(0.25);
  });
});

describe("evaluation set", () => {
  it("is separate from prototypes and demo messages", () => {
    const used = new Set([...prototypeList().map((p) => p.text), ...DEMO_MESSAGES.map((m) => m.text), AMBIGUOUS_DEMO.text]);
    for (const e of EVAL_SET) expect(used.has(e.text)).toBe(false);
  });
  it("has 30-50 messages covering every category and language plus Not sure cases", () => {
    expect(EVAL_SET.length).toBeGreaterThanOrEqual(30);
    expect(EVAL_SET.length).toBeLessThanOrEqual(50);
    for (const c of CATEGORIES) expect(EVAL_SET.some((e) => e.expected === c)).toBe(true);
    for (const l of ["en", "fr", "de"]) expect(EVAL_SET.some((e) => e.lang === l)).toBe(true);
    expect(EVAL_SET.some((e) => e.expectNotSure)).toBe(true);
    expect(new Set(EVAL_SET.map((e) => e.id)).size).toBe(EVAL_SET.length);
  });
});
