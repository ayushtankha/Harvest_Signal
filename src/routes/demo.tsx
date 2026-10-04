import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Zap, HelpCircle, Sprout } from "lucide-react";
import { Screen, BigButton, ModelLoader } from "@/components/hs";
import { meta } from "@/lib/meta";
import { submitFeedback, newSession } from "@/lib/submit";
import { resetDemo } from "@/lib/db";
import { DEMO_MESSAGES, AMBIGUOUS_DEMO } from "@/lib/taxonomy";
import { CATEGORY_NAME } from "@/lib/i18n";
import { useAI, useOfflineReady } from "@/lib/hooks";
import { swVersion } from "@/lib/sw-register";

const LANG_LABEL = { en: "English", fr: "French", de: "German" } as const;

export const Route = createFileRoute("/demo")({
  head: () => meta("Demo mode — HarvestSignal", "Reset data and run the airplane-mode judging scenario in one tap."),
  component: Demo,
});

function Demo() {
  const ai = useAI();
  const appSaved = useOfflineReady();
  const [files, setFiles] = useState(0);
  useEffect(() => { swVersion().then((v) => setFiles(v?.files ?? 0)); }, [appSaved]);
  const ready = ai.embed === "ready" && ai.stt === "ready" && appSaved;
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async (msgs: { lang: "en" | "fr" | "de"; text: string }[]) => {
    setBusy(true);
    for (const m of msgs) {
      const { result } = await submitFeedback(m.text, m.lang, newSession(), "text");
      const lbl = result.label === "not_sure" ? "Not sure" : CATEGORY_NAME.en[result.label];
      setLog((l) => [...l, `${m.lang.toUpperCase()} → ${lbl} (${result.best.toFixed(3)} vs ${result.second.toFixed(3)})`]);
    }
    setBusy(false);
  };
  const off = busy || ai.embed !== "ready";

  return (
    <Screen back="/" title="Demo">
      <ModelLoader />
      <p role="status" className="rounded-2xl bg-card p-4 text-base font-semibold ring-1 ring-border">
        {ready ? "✓ Ready for airplane mode" : "Not ready for airplane mode yet"} · Saved app files: {files}
      </p>
      <ol className="list-decimal space-y-1 pl-6 text-base text-muted-foreground">
        <li>Open the app once online, wait for ✓.</li>
        <li>Turn on airplane mode.</li>
        <li>Submit the EN, FR and DE harvest messages, then open Noor.</li>
        <li>Submit the ambiguous message → Not sure. Noor shows “Nuk ka mjaft të dhëna — pyet një vizitor.”</li>
        <li>Typing is the guaranteed offline input path. Voice is demonstrated only after successful validation on the demo device.</li>
      </ol>
      <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={async () => { await resetDemo(); setLog(["Reset ✓"]); }}>
        <RotateCcw className="h-7 w-7" /> Reset demo
      </BigButton>
      {DEMO_MESSAGES.map((m) => (
        <BigButton key={m.lang} disabled={off} onClick={() => run([m])} className="flex-col bg-primary py-3 text-primary-foreground">
          <span className="flex items-center gap-2"><Zap className="h-6 w-6" /> {LANG_LABEL[m.lang]} harvest message</span>
          <span className="text-sm font-normal">“{m.text}”</span>
        </BigButton>
      ))}
      <BigButton className="bg-accent text-accent-foreground" disabled={off}
        onClick={() => run([AMBIGUOUS_DEMO])}>
        <HelpCircle className="h-7 w-7" /> Ambiguous message (English)
      </BigButton>
      {log.length > 0 && (
        <ul className="rounded-2xl bg-card p-4 font-mono text-sm ring-1 ring-border">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      )}
      <Link to="/noor" className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-secondary text-xl font-bold text-secondary-foreground">
        <Sprout className="h-7 w-7" /> Open Noor
      </Link>
    </Screen>
  );
}
