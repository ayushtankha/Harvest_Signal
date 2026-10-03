import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Heart, Loader2, ShieldCheck } from "lucide-react";
import { Screen, BigButton, ModelLoader } from "@/components/hs";
import { meta } from "@/lib/meta";
import { VISITOR_T } from "@/lib/i18n";
import { DEMO_MESSAGES, type VisitorLang } from "@/lib/taxonomy";
import { useAI } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/visitor")({
  head: () => meta("Leave feedback — HarvestSignal", "Tell Noor what you loved or wanted to see, in English, French or German."),
  component: Visitor,
});

const LANGS: { id: VisitorLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" },
];

function Visitor() {
  const [lang, setLang] = useState<VisitorLang>("en");
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"input" | "recording" | "transcribing" | "sending" | "thanks">("input");
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const sessionRef = useRef<string | null>(null);
  const recRef = useRef<import("@/lib/speech").Recorder | null>(null);
  const ai = useAI();
  const t = VISITOR_T[lang];

  useEffect(() => {
    sessionRef.current = crypto.randomUUID();
    import("@/lib/ai").then((m) => m.loadSttModel());
  }, []);

  const send = async (msg: string, mode: "text" | "voice") => {
    if (!msg.trim()) return;
    setPhase("sending");
    setErr(null);
    try {
      const { submitFeedback } = await import("@/lib/submit");
      await submitFeedback(msg, lang, sessionRef.current!, mode);
      setText("");
      setPhase("thanks");
    } catch (e) {
      setErr(String((e as Error).message));
      setPhase("input");
    }
  };

  const startVoice = async () => {
    setErr(null);
    try {
      const { startRecording } = await import("@/lib/speech");
      recRef.current = await startRecording();
      setPhase("recording");
    } catch {
      setErr("Microphone not allowed");
    }
  };
  const stopVoice = async () => {
    const r = recRef.current;
    if (!r) return;
    setPhase("transcribing");
    try {
      const { speechToText } = await import("@/lib/speech");
      const audio = await r.stop();
      const said = await speechToText(audio, lang);
      recRef.current = null;
      setText(said);
      setMode("voice");
      setPhase("input");
    } catch (e) {
      setErr(String((e as Error).message));
      setPhase("input");
    }
  };

  if (phase === "thanks")
    return (
      <Screen back="/">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Heart className="h-20 w-20" fill="currentColor" />
          </div>
          <h1 className="text-6xl font-semibold">{t.thanks}</h1>
          <BigButton
            className="w-full bg-card text-foreground ring-1 ring-border"
            onClick={() => { sessionRef.current = crypto.randomUUID(); setPhase("input"); }}
          >
            {t.another}
          </BigButton>
        </div>
      </Screen>
    );

  const voiceReady = ai.stt === "ready";
  const busy = phase !== "input";

  return (
    <Screen back="/">
      <div className="grid grid-cols-3 gap-2" role="radiogroup">
        {LANGS.map((l) => (
          <button
            key={l.id}
            role="radio"
            aria-checked={lang === l.id}
            onClick={() => setLang(l.id)}
            className={cn("min-h-14 rounded-2xl text-lg font-bold ring-1 ring-border",
              lang === l.id ? "bg-primary text-primary-foreground" : "bg-card")}
          >
            {l.label}
          </button>
        ))}
      </div>

      <h1 className="text-4xl font-semibold leading-tight">{t.header}</h1>
      <ModelLoader />

      <button
        onClick={phase === "recording" ? stopVoice : startVoice}
        disabled={!voiceReady || (busy && phase !== "recording")}
        className={cn("flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl text-2xl font-bold shadow-md disabled:opacity-50",
          phase === "recording" ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground")}
      >
        {phase === "recording" ? <Square className="h-12 w-12" /> : phase === "transcribing" ? <Loader2 className="h-12 w-12 animate-spin" /> : <Mic className="h-12 w-12" />}
        {phase === "recording" ? t.stop : phase === "transcribing" ? t.transcribing : t.speak}
      </button>
      {!voiceReady && (
        <p className="-mt-3 text-center text-sm text-muted-foreground">
          {ai.stt === "loading" ? `🎙 ${Math.round(ai.sttProgress)}%` : t.voiceOff}
        </p>
      )}

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setMode("text"); }}
        placeholder={t.placeholder}
        rows={3}
        maxLength={280}
        className="w-full rounded-2xl bg-card p-4 text-xl ring-1 ring-input focus:outline-none focus:ring-4 focus:ring-ring"
      />
      <BigButton onClick={() => send(text, mode)} disabled={busy || !text.trim() || ai.embed !== "ready"}>
        {phase === "sending" ? <Loader2 className="h-7 w-7 animate-spin" /> : <Send className="h-7 w-7" />} {t.send}
      </BigButton>
      {err && <p className="text-center text-destructive">{err}</p>}

      <div className="flex flex-wrap gap-2">
        {DEMO_MESSAGES.filter((m) => m.lang === lang).map((m) => (
          <button key={m.text} onClick={() => setText(m.text)} className="rounded-full bg-muted px-4 py-2 text-left text-base">
            “{m.text}”
          </button>
        ))}
      </div>
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5" /> {t.privacy}
      </p>
    </Screen>
  );
}
