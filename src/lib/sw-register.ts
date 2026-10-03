// Registers the offline service worker on the published site only.
// Never inside the Lovable editor preview (iframe / preview hosts / localhost dev).
export const PUBLISHED_URL = "https://pixel-perfect-clone-91268.lovable.app";

export function isPublishedHost() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com") || host === "localhost";
  return !(inIframe || isPreview || import.meta.env.DEV);
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!isPublishedHost()) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").then((reg) => {
    // If the helper is active but not yet controlling this page, reload once (online only).
    const tryTakeover = () => {
      if (navigator.serviceWorker.controller || !reg.active || !navigator.onLine) return;
      if (sessionStorage.getItem("hs-sw-reloaded")) return;
      sessionStorage.setItem("hs-sw-reloaded", "1");
      setTimeout(() => {
        if (!navigator.serviceWorker.controller && navigator.onLine) location.reload();
      }, 1500);
    };
    tryTakeover();
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w?.addEventListener("statechange", () => { if (w.state === "activated") tryTakeover(); });
    });
  }).catch(() => {});
}

export async function swVersion(): Promise<{ version: string | null; files: number } | null> {
  const ctrl = navigator.serviceWorker?.controller;
  if (!ctrl) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data);
    ctrl.postMessage("version", [ch.port2]);
    setTimeout(() => resolve(null), 1000);
  });
}

/** True when every page is saved and the offline helper controls this page.
 *  Outside the published site (editor preview) there is no helper, so it reports true. */
export async function checkOfflineReady(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isPublishedHost()) return true;
  const v = await swVersion();
  return !!(v && v.version && v.files > 0);
}
