import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareHeart, Sprout, Settings, PlayCircle } from "lucide-react";
import { Screen, StatusBanner, ModelLoader } from "@/components/hs";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("HarvestSignal — what your visitors really want", "Offline-first visitor feedback for small farm tourism. On-device AI, no accounts, no cloud."),
  component: Welcome,
});

function Welcome() {
  return (
    <Screen>
      <StatusBanner offlineText="Offline — core AI is working on this device" onlineText="AI runs on this device — no internet needed" />
      <div className="pt-6 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Sprout className="h-11 w-11" />
        </div>
        <h1 className="text-5xl font-semibold">HarvestSignal</h1>
        <p className="mt-2 text-lg text-muted-foreground">Listen to visitors. Decide yourself.</p>
      </div>
      <ModelLoader />
      <Link to="/visitor" className="flex min-h-28 items-center gap-4 rounded-3xl bg-accent px-6 text-accent-foreground shadow-md">
        <MessageSquareHeart className="h-12 w-12" />
        <span className="text-3xl font-bold">Visitor</span>
      </Link>
      <Link to="/noor" className="flex min-h-28 items-center gap-4 rounded-3xl bg-primary px-6 text-primary-foreground shadow-md">
        <Sprout className="h-12 w-12" />
        <span className="text-3xl font-bold">Noor</span>
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/settings" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-card text-lg font-semibold ring-1 ring-border">
          <Settings className="h-6 w-6" /> Settings
        </Link>
        <Link to="/demo" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-card text-lg font-semibold ring-1 ring-border">
          <PlayCircle className="h-6 w-6" /> Demo
        </Link>
      </div>
    </Screen>
  );
}
