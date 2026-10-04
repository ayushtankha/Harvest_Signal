import { useEffect, useState, useSyncExternalStore } from "react";
import { allFeedback, getDismissed, getSettings, onDataChange, DEFAULT_SETTINGS, type Settings } from "./db";
import type { FeedbackRecord } from "./opportunity";
import type { Category } from "./taxonomy";
import { getAIStatus, subscribeAI, type AIStatus } from "./ai";
import { checkOfflineReady } from "./sw-register";
import { isVoiceInstalled, onVoiceChange } from "./voice-status";

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

/** Polls until the offline helper controls the page and all pages are saved. */
export function useOfflineReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const ok = await checkOfflineReady().catch(() => false);
      if (!alive) return;
      setReady(ok);
      if (!ok) timer = setTimeout(tick, 2000);
    };
    tick();
    const onCtrl = () => tick();
    navigator.serviceWorker?.addEventListener("controllerchange", onCtrl);
    return () => { alive = false; clearTimeout(timer); navigator.serviceWorker?.removeEventListener("controllerchange", onCtrl); };
  }, []);
  return ready;
}

/** null while checking; true/false once known. */
export function useVoiceInstalled() {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => { isVoiceInstalled().then(setV, () => setV(false)); };
    check();
    return onVoiceChange(check);
  }, []);
  return v;
}

/** Core text-only readiness: app saved + text AI ready + IndexedDB. Voice never affects it. */
export function useCoreReady() {
  const ai = useAI();
  const appSaved = useOfflineReady();
  const [idb, setIdb] = useState(false);
  useEffect(() => setIdb(typeof indexedDB !== "undefined"), []);
  return ai.embed === "ready" && appSaved && idb;
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
