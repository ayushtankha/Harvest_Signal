import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addFeedback, allFeedback, deleteAllData, getKV, saveDraft, saveSettings, getDraft, dismiss } from "./db";
import { buildRecord } from "./submit";
import { ALLOWED_FIELDS } from "./opportunity";

describe("stored records", () => {
  it("store only permitted metadata — no text, transcript, audio or session ID", async () => {
    await deleteAllData();
    const r = buildRecord({ label: "harvest_walk", best: 0.93, secondCategory: "coffee_tasting", second: 0.91 }, "fr", "voice");
    // even if extra fields sneak in, they are stripped before storage
    await addFeedback({ ...r, text: "Nous aimerions voir", transcript: "x", audio: [1], sessionId: "s" } as never);
    const [stored] = await allFeedback();
    expect(Object.keys(stored!).sort()).toEqual([...ALLOWED_FIELDS].sort());
    expect(JSON.stringify(stored)).not.toMatch(/Nous|transcript|audio|sessionId/);
    expect(stored).toMatchObject({ language: "fr", inputMode: "voice", label: "harvest_walk", accepted: true, score: 0.93 });
  });
});

describe("Delete all data", () => {
  it("clears records, dismissals, drafts and settings", async () => {
    await addFeedback(buildRecord({ label: "meals", best: 0.9, secondCategory: "prices", second: 0.8 }, "en", "text"));
    await saveDraft({ category: "harvest_walk", title: "t", duration: "d", description: "x", includes: [], savedAt: 1 });
    await saveSettings({ windowDays: 30 });
    await dismiss("meals");
    await deleteAllData();
    expect(await allFeedback()).toHaveLength(0);
    expect(await getDraft("harvest_walk")).toBeUndefined();
    expect(await getKV("settings")).toBeUndefined();
    expect(await getKV("dismissed")).toBeUndefined();
  });
});
