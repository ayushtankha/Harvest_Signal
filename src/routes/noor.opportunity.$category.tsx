import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, Pencil, X } from "lucide-react";
import { Screen, BigButton } from "@/components/hs";
import { meta } from "@/lib/meta";
import { useAppData } from "@/lib/hooks";
import { categoryStats } from "@/lib/opportunity";
import { CATEGORIES, CATEGORY_ICON, type Category } from "@/lib/taxonomy";
import { INSIGHT, LANG_NAME, T, type NoorLang } from "@/lib/i18n";
import { dismiss, saveSettings } from "@/lib/db";
import { catName } from "@/lib/catname";

export const Route = createFileRoute("/noor/opportunity/$category")({
  beforeLoad: ({ params }) => {
    if (!CATEGORIES.includes(params.category as Category) || params.category === "other") throw notFound();
  },
  head: () => meta("Opportunity — HarvestSignal", "Evidence behind a recurring visitor request: submissions, similarity and languages."),
  component: Opportunity,
});

function Opportunity() {
  const category = Route.useParams().category as Category;
  const { settings, feedback } = useAppData();
  const L = settings.noorLang as NoorLang;
  const t = T[L];
  const s = categoryStats(feedback, Date.now(), settings.windowDays)[category];
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  return (
    <Screen back="/noor">
      <p className="text-sm font-bold tracking-widest text-muted-foreground">{t.newOpp}</p>
      {editing ? (
        <div className="flex gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            className="min-h-14 flex-1 rounded-2xl bg-card px-4 text-2xl ring-1 ring-input" />
          <BigButton onClick={async () => { await saveSettings({ categoryNames: { ...settings.categoryNames, [category]: name.trim() || undefined } }); setEditing(false); }}>✓</BigButton>
        </div>
      ) : (
        <h1 className="text-5xl font-semibold">{CATEGORY_ICON[category]} {catName(category, settings)}</h1>
      )}

      <p className="rounded-3xl bg-accent p-5 text-2xl font-semibold text-accent-foreground">{INSIGHT[L][category](s.count)}</p>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="mb-3 text-xl font-semibold">{t.evidence}</h2>
        <dl className="grid grid-cols-[1fr_auto] gap-y-3 text-lg">
          <dt>{L === "sq" ? "Mendime" : "Submissions"}</dt><dd className="font-bold tabular-nums">{s.count}</dd>
          <dt>{t.avgSim}</dt><dd className="font-bold tabular-nums">{s.avgScore.toFixed(3)}</dd>
          <dt>{t.languages}</dt><dd className="text-right font-bold">{s.languages.map((l) => LANG_NAME[L][l]).join(", ") || "—"}</dd>
        </dl>
      </section>

      <Link to="/noor/tour/$category" params={{ category }}
        className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
        <ClipboardList className="h-7 w-7" /> {t.createTour}
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={() => { setName(catName(category, settings)); setEditing(true); }}>
          <Pencil className="h-6 w-6" /> {t.edit}
        </BigButton>
        <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={async () => { await dismiss(category); nav({ to: "/noor" }); }}>
          <X className="h-6 w-6" /> {t.dismiss}
        </BigButton>
      </div>
      <p className="text-center text-muted-foreground">{t.nothingPublished}</p>
    </Screen>
  );
}
