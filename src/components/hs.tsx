import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, WifiOff, Wifi, Cpu } from "lucide-react";
import { useAI, useOnline, useOfflineReady } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function Screen({ children, back, title }: { children: ReactNode; back?: string; title?: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 pb-10 pt-4">
      {(back || title) && (
        <header className="flex items-center gap-3">
          {back && (
            <Link to={back as "/"} aria-label="Back" className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
              <ArrowLeft className="h-7 w-7" />
            </Link>
          )}
          {title && <h1 className="text-3xl font-semibold">{title}</h1>}
        </header>
      )}
      {children}
    </main>
  );
}

export function StatusBanner({ offlineText, onlineText }: { offlineText: string; onlineText: string }) {
  const online = useOnline();
  const ai = useAI();
  const appSaved = useOfflineReady();
  const ready = ai.embed === "ready" && appSaved;
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold",
      online ? "bg-muted text-foreground" : "bg-secondary text-secondary-foreground")}>
      {online ? <Wifi className="h-6 w-6 shrink-0" /> : <WifiOff className="h-6 w-6 shrink-0" />}
      <span className="flex-1">{online ? onlineText : offlineText}</span>
      <span className="flex items-center gap-1 text-sm" title={ready ? "Ready for airplane mode" : "Still saving"}>
        <Cpu className="h-5 w-5" />
        {ready ? "✓" : ai.embed === "loading" ? `${Math.round(ai.embedProgress)}%` : ai.embed === "error" ? "!" : "…"}
      </span>
    </div>
  );
}

export function BigButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={cn(
        "flex min-h-16 items-center justify-center gap-3 rounded-2xl px-6 text-xl font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-50",
        className ?? "bg-primary text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ModelLoader() {
  const ai = useAI();
  const appSaved = useOfflineReady();
  if (ai.embed === "ready" && appSaved) {
    return (
      <div role="status" className="rounded-2xl bg-card p-4 text-base font-semibold ring-1 ring-border">
        ✓ Ready for airplane mode
      </div>
    );
  }
  if (ai.embed === "ready") {
    return (
      <div role="status" className="rounded-2xl bg-card p-4 text-base font-semibold ring-1 ring-border">
        Still saving the app — keep Wi-Fi on
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="mb-2 flex justify-between text-base font-semibold">
        <span>{ai.embed === "error" ? "AI model failed to load" : "Preparing AI on this device"}</span>
        <span>{Math.round(ai.embedProgress)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-accent transition-all" style={{ width: `${ai.embedProgress}%` }} />
      </div>
      {ai.error && <p className="mt-2 text-sm text-destructive">{ai.error}</p>}
      <p className="mt-2 text-sm text-muted-foreground">First time only. Afterwards it works without internet. Keep Wi-Fi on until it says "Ready for airplane mode".</p>
    </div>
  );
}
