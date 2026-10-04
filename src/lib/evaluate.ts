// Pure metrics over evaluation predictions. Does not run the model itself.
import type { Label } from "./classifier";
import type { EvalRecord } from "./eval-set";

export interface EvalPrediction { record: EvalRecord; predicted: Label }

export interface EvalReport {
  total: number;
  correct: number;
  accuracy: number;
  byLanguage: Record<string, { total: number; correct: number }>;
  byCategory: Record<string, { total: number; correct: number }>;
  notSureRate: number;
  rejectionTotal: number;
  correctRejections: number;
  correctRejectionRate: number;
  confidentlyWrong: number;
  confusion: { id: string; expected: string; predicted: string }[];
}

export function evaluate(preds: EvalPrediction[]): EvalReport {
  const byLanguage: EvalReport["byLanguage"] = {};
  const byCategory: EvalReport["byCategory"] = {};
  let correct = 0, notSure = 0, rejectionTotal = 0, correctRejections = 0, confidentlyWrong = 0;
  const confusion: EvalReport["confusion"] = [];
  for (const { record, predicted } of preds) {
    const expected = record.expectNotSure ? "not_sure" : record.expected!;
    const ok = predicted === expected;
    if (ok) correct++;
    if (predicted === "not_sure") notSure++;
    if (record.expectNotSure) { rejectionTotal++; if (ok) correctRejections++; }
    if (!ok && predicted !== "not_sure") confidentlyWrong++;
    if (!ok) confusion.push({ id: record.id, expected, predicted });
    (byLanguage[record.lang] ??= { total: 0, correct: 0 }).total++;
    if (ok) byLanguage[record.lang]!.correct++;
    (byCategory[expected] ??= { total: 0, correct: 0 }).total++;
    if (ok) byCategory[expected]!.correct++;
  }
  const n = preds.length;
  return {
    total: n, correct, accuracy: n ? correct / n : 0, byLanguage, byCategory,
    notSureRate: n ? notSure / n : 0, rejectionTotal, correctRejections,
    correctRejectionRate: rejectionTotal ? correctRejections / rejectionTotal : 0,
    confidentlyWrong, confusion,
  };
}
