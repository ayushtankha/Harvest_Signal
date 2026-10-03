// Registers the offline service worker on the published site only.
// Never inside the Lovable editor preview (iframe / preview hosts / localhost dev).
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com") || host === "localhost";
  if (inIframe || isPreview || import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export async function swVersion(): Promise<string | null> {
  const ctrl = navigator.serviceWorker?.controller;
  if (!ctrl) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data);
    ctrl.postMessage("version", [ch.port2]);
    setTimeout(() => resolve(null), 1000);
  });
}
