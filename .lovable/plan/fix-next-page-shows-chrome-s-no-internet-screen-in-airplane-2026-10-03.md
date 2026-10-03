# Fix: next page shows Chrome's "no internet" screen in airplane mode (Android)

## What we know
- The live app already has the new offline helper. On a computer it opens every page offline.
- On your Android phone you see Chrome's own offline page. That means the offline helper was **not yet in charge of the page** when you went offline. The green AI tick only means the AI files are saved, not the app's pages, so it gave a false "ready" signal.

## What to change (no visual redesign)
1. **One honest "Ready for airplane mode" tick.** It only turns green when all three are true: AI saved, every page saved, and the offline helper controls this page. Until then it shows "Still saving the app — keep Wi-Fi on".
2. **Offline helper takes charge right away** after it finishes saving, without needing a reload; if it still can't, the app reloads itself once (online only) so it takes charge.
3. **More robust saving on phones:** retry a failed page download instead of giving up the whole save; save pages one by one so a weak connection doesn't break it.
4. **Keep links inside the app** so moving between pages never asks the internet for a new page when offline.
5. README: the airplane-mode test starts only after the "Ready for airplane mode" tick.

## Test
- Recreate the exact steps on an Android-sized Chrome: open live app, wait for tick, go offline, open every page.
- Then you repeat on your phone: open online, wait for the new tick, airplane mode, tap through pages.

## Technical details
- `public/sw.js`: per-route retry with backoff, sequential fetch, `skipWaiting()` in install, `clients.claim()` in activate, post "ready" message with file count.
- `sw-register.ts`: expose `offlineReady` = `navigator.serviceWorker.controller` present AND app cache version matches; on `controllerchange` absent after activation, single guarded `location.reload()` while online.
- `hooks.ts` / AI status UI: combine model-ready and offlineReady into the single tick (existing component, text from `i18n.ts`).
- Audit links for plain `<a href>` and switch to router `Link`.
