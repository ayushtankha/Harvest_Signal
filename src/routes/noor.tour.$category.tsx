import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Save, Check } from "lucide-react";
import { Screen, BigButton } from "@/components/hs";
import { meta } from "@/lib/meta";
import { CATEGORIES, type Category } from "@/lib/taxonomy";
import { T, TOUR_TEMPLATE, type NoorLang } from "@/lib/i18n";
import { getDraft, getSettings, saveDraft, type TourDraft } from "@/lib/db";

export const Route = createFileRoute("/noor/tour/$category")({
  beforeLoad: ({ params }) => {
    if (!CATEGORIES.includes(params.category as Category) || params.category === "other") throw notFound();
  },
  head: () => meta("Tour draft — HarvestSignal", "A fixed, editable tour template. Nothing is published automatically."),
  component: Tour,
});

function Tour() {
  const category = Route.useParams().category as Exclude<Category, "other">;
  const [L, setL] = useState<NoorLang>("sq");
  const [d, setD] = useState<TourDraft | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const lang = s.noorLang as NoorLang;
      setL(lang);
      setD((await getDraft(category)) ?? { category, ...TOUR_TEMPLATE[lang][category], savedAt: 0 });
    })();
  }, [category]);

  if (!d) return <Screen back="/noor">{null}</Screen>;
  const t = T[L];
  const set = (p: Partial<TourDraft>) => { setD({ ...d, ...p }); setSaved(false); };
  const field = "w-full rounded-xl bg-background p-3 text-lg ring-1 ring-input";

  return (
    <Screen back={`/noor/opportunity/${category}`}>
      <span className="self-start rounded-full bg-accent px-4 py-1 text-base font-bold text-accent-foreground">{t.draft}</span>
      <article className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
        <Field label={t.title}>
          {editing ? <input className={field} value={d.title} onChange={(e) => set({ title: e.target.value })} /> : <h1 className="text-3xl font-semibold">{d.title}</h1>}
        </Field>
        <Field label={t.duration}>
          {editing ? <input className={field} value={d.duration} onChange={(e) => set({ duration: e.target.value })} /> : <p className="text-xl font-bold">{d.duration}</p>}
        </Field>
        <Field label={t.description}>
          {editing ? <textarea rows={3} className={field} value={d.description} onChange={(e) => set({ description: e.target.value })} /> : <p className="text-lg">{d.description}</p>}
        </Field>
        <Field label={t.includes}>
          {editing ? (
            <textarea rows={4} className={field} value={d.includes.join("\n")} onChange={(e) => set({ includes: e.target.value.split("\n") })} />
          ) : (
            <ul className="flex flex-col gap-1 text-lg">{d.includes.filter(Boolean).map((i) => <li key={i}>• {i}</li>)}</ul>
          )}
        </Field>
      </article>
      <div className="grid grid-cols-2 gap-3">
        <BigButton className="bg-card text-foreground ring-1 ring-border" onClick={() => setEditing(!editing)}>
          {editing ? <Check className="h-6 w-6" /> : <Pencil className="h-6 w-6" />} {t.edit}
        </BigButton>
        <BigButton onClick={async () => { await saveDraft({ ...d, includes: d.includes.filter(Boolean), savedAt: Date.now() }); setEditing(false); setSaved(true); }}>
          <Save className="h-6 w-6" /> {t.saveDraft}
        </BigButton>
      </div>
      {saved && <p className="text-center font-semibold text-secondary">✓ {t.saved}</p>}
      <p className="text-center text-lg font-semibold">{t.nothingPublished}</p>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
