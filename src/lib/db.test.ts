import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addFeedback, allFeedback, deleteAllData, getKV, saveDraft, saveSettings, getDraft } from "./db";

describe("Delete all data", () => {
  it("clears feedback, drafts and settings", async () => {
    await addFeedback({ id: "1", sessionId: "s", label: "harvest_walk", score: 0.9, secondCategory: "meals", second: 0.8, language: "en", inputMode: "text", ts: Date.now() });
    await saveDraft({ category: "harvest_walk", title: "t", duration: "d", description: "x", includes: [], savedAt: 1 });
    await saveSettings({ windowDays: 30 });
    expect(await allFeedback()).toHaveLength(1);
    await deleteAllData();
    expect(await allFeedback()).toHaveLength(0);
    expect(await getDraft("harvest_walk")).toBeUndefined();
    expect(await getKV("settings")).toBeUndefined();
  });
});
