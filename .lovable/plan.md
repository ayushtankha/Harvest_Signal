# Fix: pages don't open in airplane mode

## What's wrong
I checked the published app. The home page only loads the code for itself. The code for every other page (Visitor, Noor, Opportunity, Tour, Settings, Demo) is a separate file the phone only downloads when you first open that page. The offline helper (service worker) saves files only after they've been used once, so pages you never opened online have nothing saved. Tapping "Visitor" offline then tries to download its code and fails silently.

## Fix (no design or feature changes)

1. **Save the whole app on the first online visit**
   - When the offline helper installs, it reads the home page and follows every code, style and font file it references, and the files those reference, until it has all of them. That includes every page, the AI worker and the AI engine loader. Everything is saved before the helper takes over.
   - This works from whatever the published build produces, so it stays correct after every republish without a hand-kept file list.
   - The helper's version name changes with each build, so old saved files are swapped for new ones.

2. **Pages open offline**
   - Opening any page address offline serves the saved copy of that page. Pages with a category in the address (Opportunity, Tour) fall back to the saved app shell, and the app then shows the right page on the phone.
   - Never redirects anywhere online.

3. **Takes control right away**
   - After installing, the helper takes over open tabs immediately. Settings → Offline proof already shows the real state; add one line, "Controls this page: yes/no", plus the number of saved app files.

4. **Clear message instead of a blank page**
   - If a page's code is missing offline, show "This part of the app isn't saved on this phone yet — open it once online" instead of a blank screen. Never falls back to an online service.

5. **AI unchanged**
   - Model files keep their own saved copy, as now. No change to the AI, local storage or privacy.

6. **README**
   - Replace the offline test steps with: "Open the published app once online, wait for the application and models to cache, reload once so the service worker controls the page, then enable airplane mode and test navigation between all core routes," followed by the A–K checklist.

## Verification
- Build the production version here and serve it locally the same way as the live site. In a test browser: load once online, reload, switch offline, reload, then visit Visitor, Noor, Opportunity, Tour, Settings and Demo, and run the demo. Confirm no request reaches the network.
- After you publish, I run the same checks against the live address. I'll only call it fixed once the live site passes. The final check on your real phone is still yours.

## Technical details
- `public/sw.js`: install handler crawls `/` HTML, then recursively regex-scans fetched JS/CSS for `/assets/*.{js,mjs,css,woff2,woff,svg,png,ico,wasm}` same-origin URLs and `addAll`s them, along with the route HTML for `/`, `/visitor`, `/noor`, `/settings`, `/demo`. Navigation: network-first with a short timeout → cached exact URL → cached `/`. `/assets/*` cache-first (immutable hashed names). VERSION derived from the entry script hash found during the crawl; activate deletes old `hs-app-*` caches; `skipWaiting` + `clients.claim` kept.
- Router: `defaultErrorComponent`/root error component detects a failed dynamic import (`Failed to fetch dynamically imported module` / offline) and renders the fixed offline message.
- `settings.tsx` offline proof: add `navigator.serviceWorker.controller` status and the app-cache entry count.
- Model cache (`harvestsignal-models-v1`) and the AI worker remain as they are.
