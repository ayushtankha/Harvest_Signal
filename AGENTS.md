<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All AI inference runs in `src/lib/ai-worker.ts` (Web Worker); no backend or cloud AI — the product must work in airplane mode.
- Model files >10 MB are stored via lovable-assets and remapped from `/models/...` paths inside the worker fetch; small model files live in `public/models/` — repo file size limit.
- Classification and opportunity rules are pure functions in `classifier.ts` / `opportunity.ts` with unit tests — thresholds must stay calibratable.
- All user-facing output text is fixed translations in `i18n.ts`; never generate free text — guardrail requirement.
- Service worker registers only on the published host, never in preview/iframe, and precaches the whole build by crawling HTML → referenced assets at install — avoids stale preview caches and keeps lazy route chunks available offline.
- Browser-only modules used in submit flows are statically imported so they work offline without lazy chunk fetches.
- Stored feedback records are whitelisted through `sanitizeRecord` in `opportunity.ts` (also applied by DB migration) — guarantees no visitor text/audio/identifiers persist.
