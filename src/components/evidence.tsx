import type { CategoryStat } from "@/lib/opportunity";
import { LANG_NAME, T, type NoorLang } from "@/lib/i18n";
import type { Settings } from "@/lib/db";
import { catName } from "@/lib/catname";

/** "Why this opportunity?" — structured metadata only; never visitor words. */
export function WhyOpportunity({ stat, L, settings, open }: { stat: CategoryStat; L: NoorLang; settings: Settings; open?: boolean }) {
  const t = T[L];
  const name = catName(stat.category, settings);
  const fmt = new Intl.DateTimeFormat(L === "sq" ? "sq-AL" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <details open={open} className="rounded-2xl bg-card p-4 text-foreground ring-1 ring-border">
      <summary className="min-h-12 cursor-pointer text-lg font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-ring">
        {t.whyOpp}
      </summary>
      <p className="mt-2 text-base font-semibold">{stat.count} {t.matched} “{name}”.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {stat.records.map((r) => {
          const parts = [LANG_NAME[L][r.language], r.inputMode === "voice" ? t.voice : t.text, fmt.format(r.ts), name, `${t.similarity} ${r.score.toFixed(2)}`];
          return (
            <li key={r.id} aria-label={parts.join(", ")} className="rounded-xl bg-muted px-3 py-2 text-base">
              <span aria-hidden>✓ {t.accepted} · {parts.join(" · ")}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">{t.simExplain}</p>
    </details>
  );
}
