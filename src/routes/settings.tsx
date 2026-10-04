import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, ShieldCheck, Lock, Check, X as XIcon, RefreshCw } from "lucide-react";
import { Screen, BigButton } from "@/components/hs";
import { meta } from "@/lib/meta";
import { useAI, useAppData, useOnline } from "@/lib/hooks";
import { countFeedback, deleteAllData, saveSettings } from "@/lib/db";
import { swVersion, isPublishedHost, PUBLISHED_URL } from "@/lib/sw-register";
import { DEFAULT_THRESHOLDS } from "@/lib/classifier";

export const Route = createFileRoute("/settings")({
  head: () => meta("Settings & privacy — HarvestSignal", "Privacy, data deletion, thresholds and proof that the AI runs offline on this device."),
  component: SettingsPage,
});

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hs:" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function SettingsPage() {
  const { settings, loaded } = useAppData();
  const [unlocked, setUnlocked] = useState(false);
  const [pinTry, setPinTry] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  if (loaded && settings.pinHash && !unlocked)
    return (
      <Screen back="/" title="🔒">
        <input inputMode="numeric" type="password" value={pinTry} onChange={(e) => setPinTry(e.target.value)} placeholder="PIN"
          className="min-h-16 rounded-2xl bg-card px-4 text-center text-3xl tracking-widest ring-1 ring-input" />
        <BigButton onClick={async () => { if ((await sha(pinTry)) === settings.pinHash) setUnlocked(true); else setPinTry(""); }}>
          <Lock className="h-6 w-6" /> OK
        </BigButton>
      </Screen>
    );

  const num = (k: "minScore" | "minMargin" | "windowDays", step: number, label: string, hint: string) => (
    <label className="flex flex-col gap-1">
      <span className="font-semibold">{label}</span>
      <input type="number" step={step} defaultValue={settings[k]} key={settings[k]}
        onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) saveSettings({ [k]: v }); }}
        className="min-h-14 rounded-xl bg-background px-3 text-xl ring-1 ring-input" />
      <span className="text-sm text-muted-foreground">{hint}</span>
    </label>
  );

  return (
    <Screen back="/" title="Settings">
      <section className="rounded-3xl bg-secondary p-5 text-secondary-foreground">
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-semibold"><ShieldCheck className="h-7 w-7" /> Privacy</h2>
        <p className="text-lg leading-relaxed">
          Your feedback stays on this device.<br />No names or contact details are collected.<br />
          Voice recordings are deleted after local transcription.<br />You can delete all stored data.
        </p>
        <p className="mt-3 text-base opacity-90">
          If the device is lost: data exists only on this device, there is no cloud copy. A PIN protects these settings.
          Clearing the app's data in the browser removes everything.
        </p>
      </section>

      {confirmDel ? (
        <div className="grid grid-cols-2 gap-3">
          <BigButton className="bg-destructive text-destructive-foreground" onClick={async () => { await deleteAllData(); setConfirmDel(false); }}>
            <Check className="h-6 w-6" /> Delete
          </BigButton>
          <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={() => setConfirmDel(false)}>
            <XIcon className="h-6 w-6" /> Cancel
          </BigButton>
        </div>
      ) : (
        <BigButton className="bg-destructive text-destructive-foreground" onClick={() => setConfirmDel(true)}>
          <Trash2 className="h-7 w-7" /> Delete all data
        </BigButton>
      )}

      <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl font-semibold">Noor's language</h2>
        <div className="grid grid-cols-2 gap-2">
          {(["sq", "en"] as const).map((l) => (
            <button key={l} onClick={() => saveSettings({ noorLang: l })}
              className={`min-h-14 rounded-2xl text-lg font-bold ring-1 ring-border ${settings.noorLang === l ? "bg-primary text-primary-foreground" : "bg-background"}`}>
              {l === "sq" ? "Shqip" : "English"}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Albanian is the prototype's local-language localization.</p>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl font-semibold">Classification</h2>
        {num("minScore", 0.005, "Minimum similarity", `Below this → "Not sure". Default ${DEFAULT_THRESHOLDS.minScore}`)}
        {num("minMargin", 0.001, "Minimum gap to 2nd category", `Smaller gap → "Not sure". Default ${DEFAULT_THRESHOLDS.minMargin}`)}
        {num("windowDays", 1, "Season window (days)", "Opportunity needs 3 separate anonymous visitor submissions (one per session) inside this window.")}
        <button className="flex items-center gap-2 self-start text-base underline"
          onClick={() => saveSettings({ ...DEFAULT_THRESHOLDS, windowDays: 90, categoryNames: {} })}>
          <RefreshCw className="h-4 w-4" /> Restore defaults
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl font-semibold">PIN</h2>
        <input inputMode="numeric" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New PIN (4+ digits)"
          className="min-h-14 rounded-xl bg-background px-3 text-xl ring-1 ring-input" />
        <div className="grid grid-cols-2 gap-2">
          <BigButton disabled={newPin.length < 4} onClick={async () => { await saveSettings({ pinHash: await sha(newPin) }); setNewPin(""); }}>Set PIN</BigButton>
          <BigButton className="bg-background text-foreground ring-1 ring-border" disabled={!settings.pinHash}
            onClick={() => saveSettings({ pinHash: undefined })}>Remove</BigButton>
        </div>
      </section>

      <OfflineProof />
    </Screen>
  );
}

function OfflineProof() {
  const ai = useAI();
  const online = useOnline();
  const [published, setPublished] = useState(true);
  useEffect(() => setPublished(isPublishedHost()), []);
  const appSaved = useOfflineReady();
  const ready = ai.embed === "ready" && ai.stt === "ready" && appSaved;
  const [idb, setIdb] = useState(false);
  useEffect(() => setIdb(typeof indexedDB !== "undefined"), []);
  const [info, setInfo] = useState<{ sw: boolean; version: string | null; files: number; records: number; modelFiles: string[] }>({ sw: false, version: null, files: 0, records: 0, modelFiles: [] });
  useEffect(() => {
    (async () => {
      const sw = !!navigator.serviceWorker?.controller;
      const v = await swVersion();
      const version = v?.version ?? null;
      const files = v?.files ?? 0;
      const records = await countFeedback();
      let modelFiles: string[] = [];
      if ("caches" in window) {
        const c = await caches.open("harvestsignal-models-v1");
        modelFiles = (await c.keys()).map((r) => new URL(r.url).pathname.split("/").slice(-2).join("/"));
      }
      setInfo({ sw, version, files, records, modelFiles });
    })();
  }, [ai.embed, ai.stt]);

  const row = (ok: boolean | null, label: string, value?: string) => (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ok ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
        {ok ? "✓" : "–"}
      </span>
      <span className="flex-1">{label}{value && <span className="block text-sm text-muted-foreground">{value}</span>}</span>
    </li>
  );

  return (
    <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <h2 className="mb-3 text-2xl font-semibold">Offline proof</h2>
      <ul className="flex flex-col gap-3 text-lg">
        {row(ready, ready ? "✓ Ready for airplane mode" : "Not ready for airplane mode yet", ready ? undefined : "Needs text model, speech model, saved app files and service worker control")}
        {row(true, `Status: ${online ? "online" : "offline"}`)}
        {row(ai.embed === "ready", "Text model loaded locally", ai.embed)}
        {row(ai.stt === "ready", "Speech model loaded locally", ai.stt)}
        {row(info.sw, `Service worker controls this page: ${info.sw ? "yes" : "no"}`, info.sw ? undefined : published ? "Still saving — keep Wi-Fi on; the app reloads itself once when ready" : `Offline saving is off on this address (editor preview). Open ${PUBLISHED_URL} in Chrome instead.`)}
        {row(info.files > 0, `Saved app files: ${info.files}`)}
        {row(info.modelFiles.length > 0, `Cached model files: ${info.modelFiles.length}`, info.modelFiles.join(", "))}
        {row(idb, `IndexedDB available: ${idb ? "yes" : "no"}`)}
        {row(true, "Network not required for classification")}
        {row(null, "First install ≈ 209 MB, once, over Wi-Fi or side-loaded", "Text classifier ≈ 135 MB · speech ≈ 45 MB · AI engine ≈ 28 MB. Meant for a shared farm tablet or phone.")}
        {row(true, `Local feedback records: ${info.records}`)}
        {row(!!info.version, "Cached app version", info.version ?? "none")}
      </ul>
    </section>
  );
}
