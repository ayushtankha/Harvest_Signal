import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, Zap, HelpCircle, Sprout } from "lucide-react";
import { Screen, BigButton, ModelLoader } from "@/components/hs";
import { meta } from "@/lib/meta";
import { submitFeedback } from "@/lib/submit";
import { resetDemo } from "@/lib/db";
import { DEMO_MESSAGES, AMBIGUOUS_DEMO } from "@/lib/taxonomy";
import { CATEGORY_NAME } from "@/lib/i18n";
import { useAI } from "@/lib/hooks";

export const Route = createFileRoute("/demo")({
  head: () => meta("Demo mode — HarvestSignal", "Reset data and run the airplane-mode judging scenario in one tap."),
  component: Demo,
});

function Demo() {
  const ai = useAI();
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async (msgs: { lang: "en" | "fr" | "de"; text: string }[]) => {
    setBusy(true);
    for (const m of msgs) {
      const { result } = await submitFeedback(m.text, m.lang, crypto.randomUUID(), "text");
      const lbl = result.label === "not_sure" ? "Not sure" : CATEGORY_NAME.en[result.label];
      setLog((l) => [...l, `${m.lang.toUpperCase()} → ${lbl} (${result.best.toFixed(3)} vs ${result.second.toFixed(3)})`]);
    }
    setBusy(false);
  };

  return (
    <Screen back="/" title="Demo">
      <ModelLoader />
      <ol className="list-decimal space-y-1 pl-6 text-base text-muted-foreground">
        <li>Open the app once online, wait for ✓.</li>
        <li>Turn on airplane mode.</li>
        <li>Tap “3 harvest messages”, then open Noor.</li>
        <li>Reset, then tap “1 ambiguous message” → Not sure. Noor shows “Not enough data”.</li>
      </ol>
      <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={async () => { await resetDemo(); setLog(["Reset ✓"]); }}>
        <RotateCcw className="h-7 w-7" /> Reset demo
      </BigButton>
      <BigButton disabled={busy || ai.embed !== "ready"} onClick={() => run(DEMO_MESSAGES)}>
        <Zap className="h-7 w-7" /> 3 harvest messages
      </BigButton>
      <BigButton className="bg-accent text-accent-foreground" disabled={busy || ai.embed !== "ready"}
        onClick={() => run([AMBIGUOUS_DEMO])}>
        <HelpCircle className="h-7 w-7" /> 1 ambiguous message (Not sure)
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
