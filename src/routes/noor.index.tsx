import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, HelpCircle, Settings } from "lucide-react";
import { Screen, StatusBanner, ModelLoader } from "@/components/hs";
import { meta } from "@/lib/meta";
import { useAppData } from "@/lib/hooks";
import { categoryStats, opportunities, OPPORTUNITY_MIN } from "@/lib/opportunity";
import { CATEGORIES, CATEGORY_ICON } from "@/lib/taxonomy";
import { INSIGHT, T, type NoorLang } from "@/lib/i18n";
import { catName } from "@/lib/catname";

export const Route = createFileRoute("/noor/")({
  head: () => meta("Noor's dashboard — HarvestSignal", "Season counts of visitor feedback and new opportunities, computed on this device."),
  component: Noor,
});

function Noor() {
  const { loaded, feedback, settings, dismissed } = useAppData();
  const L = settings.noorLang as NoorLang;
  const t = T[L];
  const now = Date.now();
  const stats = categoryStats(feedback, now, settings.windowDays);
  const opps = opportunities(stats, dismissed);
  const from = now - settings.windowDays * 86_400_000;
  const notSure = feedback.filter((f) => f.label === "not_sure" && f.ts >= from).length;
  const max = Math.max(OPPORTUNITY_MIN, ...Object.values(stats).map((s) => s.count));

  return (
    <Screen back="/" title="Noor">
      <StatusBanner offlineText={t.offline} onlineText={t.online} />
      <ModelLoader />

      {loaded && opps.map((o) => (
        <section key={o.category} className="rounded-3xl bg-accent p-5 text-accent-foreground shadow-md">
          <p className="flex items-center gap-2 text-sm font-bold tracking-widest"><Sparkles className="h-5 w-5" /> {t.newOpp}</p>
          <h2 className="mt-1 text-4xl font-semibold">{CATEGORY_ICON[o.category]} {catName(o.category, settings)}</h2>
          <p className="mt-2 text-xl">{INSIGHT[L][o.category](o.count)}</p>
          <Link to="/noor/opportunity/$category" params={{ category: o.category }}
            className="mt-4 flex min-h-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {t.open}
          </Link>
        </section>
      ))}

      {loaded && opps.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 text-lg font-semibold ring-1 ring-border">
          <HelpCircle className="h-8 w-8 shrink-0 text-muted-foreground" /> {t.notEnough}
        </div>
      )}

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-2xl font-semibold">{t.feedback}</h2>
        <p className="text-muted-foreground">{t.season} · {settings.windowDays} {t.days}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {CATEGORIES.filter((c) => c !== "other").map((c) => (
            <li key={c} className="flex items-center gap-3">
              <span className="w-8 text-2xl">{CATEGORY_ICON[c]}</span>
              <div className="flex-1">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{catName(c, settings)}</span><span className="tabular-nums">{stats[c].count}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className={stats[c].count >= OPPORTUNITY_MIN ? "h-full bg-secondary" : "h-full bg-primary/60"}
                    style={{ width: `${(stats[c].count / max) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
          <li className="flex justify-between border-t border-border pt-3 text-base text-muted-foreground">
            <span>{CATEGORY_ICON.other} {catName("other", settings)}</span><span>{stats.other.count}</span>
          </li>
          <li className="flex justify-between text-base text-muted-foreground">
            <span>❔ {t.notSure}</span><span>{notSure}</span>
          </li>
        </ul>
      </section>

      <p className="text-center text-base text-muted-foreground">{t.noorDecides}</p>
      <Link to="/settings" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-card font-semibold ring-1 ring-border">
        <Settings className="h-6 w-6" /> {t.settings}
      </Link>
    </Screen>
  );
}
