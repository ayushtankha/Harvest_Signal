import { openDB, type IDBPDatabase } from "idb";
import { sanitizeRecord, type FeedbackRecord } from "./opportunity";
import type { Category } from "./taxonomy";
import { DEFAULT_THRESHOLDS, type Thresholds } from "./classifier";

export interface TourDraft {
  category: Category;
  title: string;
  duration: string;
  description: string;
  includes: string[];
  savedAt: number;
}

export interface Settings extends Thresholds {
  windowDays: number;
  noorLang: "sq" | "en";
  categoryNames: Partial<Record<Category, string>>;
  pinHash?: string | undefined;
}

export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_THRESHOLDS, windowDays: 90, noorLang: "sq", categoryNames: {} };

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  dbp ??= openDB("harvestsignal", 2, {
    async upgrade(d, oldVersion, _new, tx) {
      if (oldVersion < 1) {
        d.createObjectStore("feedback", { keyPath: "id" });
        d.createObjectStore("drafts", { keyPath: "category" });
        d.createObjectStore("kv");
      }
      if (oldVersion < 2 && oldVersion >= 1) {
        // Migration: strip every field outside the permitted metadata (e.g. sessionId, any text).
        const store = tx.objectStore("feedback");
        let cur = await store.openCursor();
        while (cur) {
          const clean = sanitizeRecord(cur.value as Record<string, unknown>);
          if (clean) await cur.update(clean); else await cur.delete();
          cur = await cur.continue();
        }
      }
    },
  });
  return dbp;
}

const bus = new EventTarget();
export const onDataChange = (fn: () => void) => {
  bus.addEventListener("change", fn);
  return () => bus.removeEventListener("change", fn);
};
const changed = () => bus.dispatchEvent(new Event("change"));

export async function addFeedback(r: FeedbackRecord) {
  const clean = sanitizeRecord(r as unknown as Record<string, unknown>);
  if (!clean) throw new Error("invalid record");
  await (await db()).put("feedback", clean); changed();
}
export async function allFeedback(): Promise<FeedbackRecord[]> { return (await db()).getAll("feedback"); }
export async function countFeedback() { return (await db()).count("feedback"); }

export async function getKV<T>(key: string): Promise<T | undefined> { return (await db()).get("kv", key); }
export async function setKV(key: string, v: unknown) { await (await db()).put("kv", v, key); changed(); }

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await getKV<Settings>("settings")) ?? {}) };
}
export async function saveSettings(s: Partial<Settings>) { await setKV("settings", { ...(await getSettings()), ...s }); }

export async function getDismissed() { return (await getKV<Partial<Record<Category, number>>>("dismissed")) ?? {}; }
export async function dismiss(c: Category) { await setKV("dismissed", { ...(await getDismissed()), [c]: Date.now() }); }

export async function getDraft(c: Category): Promise<TourDraft | undefined> { return (await db()).get("drafts", c); }
export async function saveDraft(d: TourDraft) { await (await db()).put("drafts", d); changed(); }

/** Clears feedback, drafts and dismissals; keeps settings + cached prototype vectors. */
export async function resetDemo() {
  const d = await db();
  await d.clear("feedback"); await d.clear("drafts"); await d.delete("kv", "dismissed");
  changed();
}

/** Deletes everything stored by the app on this device. */
export async function deleteAllData() {
  const d = await db();
  await d.clear("feedback"); await d.clear("drafts"); await d.clear("kv");
  changed();
}
