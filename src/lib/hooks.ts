import { useEffect, useState, useSyncExternalStore } from "react";
import { allFeedback, getDismissed, getSettings, onDataChange, DEFAULT_SETTINGS, type Settings } from "./db";
import type { FeedbackRecord } from "./opportunity";
import type { Category } from "./taxonomy";
import { getAIStatus, subscribeAI, type AIStatus } from "./ai";

const SERVER_AI: AIStatus = { embed: "idle", stt: "idle", embedProgress: 0, sttProgress: 0 };

export function useAI() {
  return useSyncExternalStore(subscribeAI, getAIStatus, () => SERVER_AI);
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);
  return online;
}

export function useAppData() {
  const [state, setState] = useState<{
    loaded: boolean;
    feedback: FeedbackRecord[];
    settings: Settings;
    dismissed: Partial<Record<Category, number>>;
  }>({ loaded: false, feedback: [], settings: DEFAULT_SETTINGS, dismissed: {} });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [feedback, settings, dismissed] = await Promise.all([allFeedback(), getSettings(), getDismissed()]);
      if (alive) setState({ loaded: true, feedback, settings, dismissed });
    };
    load();
    const off = onDataChange(load);
    return () => { alive = false; off(); };
  }, []);
  return state;
}
