import { CATEGORIES, type Category } from "./taxonomy";

export interface Thresholds {
  minScore: number;
  minMargin: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { minScore: 0.84, minMargin: 0.012 };
export const TOP_K = 3;

export interface ProtoVec {
  category: Category;
  vec: number[];
}

export type Label = Category | "not_sure";

export interface ClassificationResult {
  label: Label;
  bestCategory: Category;
  best: number;
  secondCategory: Category;
  second: number;
  scores: Record<Category, number>;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!, y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Per category: mean of the top-K prototype similarities. */
export function scoreCategories(vec: number[], protos: ProtoVec[], k = TOP_K): Record<Category, number> {
  const sims: Record<string, number[]> = {};
  for (const p of protos) (sims[p.category] ??= []).push(cosine(vec, p.vec));
  const scores = {} as Record<Category, number>;
  for (const c of CATEGORIES) {
    const top = (sims[c] ?? []).sort((x, y) => y - x).slice(0, k);
    scores[c] = top.length ? top.reduce((s, v) => s + v, 0) / top.length : 0;
  }
  return scores;
}

/** Decide from scores. Returns "not_sure" when score or margin is insufficient. */
export function decide(scores: Record<Category, number>, t: Thresholds): ClassificationResult {
  const ranked = (Object.entries(scores) as [Category, number][]).sort((a, b) => b[1] - a[1]);
  const [bestCategory, best] = ranked[0]!;
  const [secondCategory, second] = ranked[1] ?? [bestCategory, 0];
  const confident = best >= t.minScore && best - second >= t.minMargin;
  return { label: confident ? bestCategory : "not_sure", bestCategory, best, secondCategory, second, scores };
}

export function classifyVector(vec: number[], protos: ProtoVec[], t: Thresholds): ClassificationResult {
  return decide(scoreCategories(vec, protos), t);
}

/** E5 expects this prefix for symmetric similarity tasks. */
export const e5 = (text: string) => `query: ${text.trim()}`;
