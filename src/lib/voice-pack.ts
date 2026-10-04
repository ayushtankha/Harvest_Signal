// Optional voice pack install/remove. Loaded lazily from Settings (online-only action).
import { VOICE_CACHE, VOICE_FILES, VOICE_MARKER, VOICE_PACK_BYTES, emitVoiceChange } from "./voice-status";
import { MODEL_CACHE_NAME, resetStt } from "./ai";

/** Downloads every voice file, verifies exact byte sizes, and only then caches them. */
export async function installVoicePack(onProgress: (done: number, total: number) => void) {
  if (!navigator.onLine) throw new Error("offline");
  const blobs: { key: string; body: ArrayBuffer; type: string }[] = [];
  let done = 0;
  for (const f of VOICE_FILES) {
    const res = await fetch(f.src, { cache: "no-store" });
    if (!res.ok || !res.body) throw new Error(`Download failed: ${f.key}`);
    const reader = res.body.getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      parts.push(value);
      got += value.length;
      onProgress(done + got, VOICE_PACK_BYTES);
    }
    if (got !== f.size) throw new Error(`Incomplete file: ${f.key} (${got} of ${f.size} bytes)`);
    const body = new Uint8Array(got);
    let o = 0;
    for (const p of parts) { body.set(p, o); o += p.length; }
    blobs.push({ key: f.key, body: body.buffer, type: res.headers.get("content-type") ?? "application/octet-stream" });
    done += f.size;
  }
  const c = await caches.open(VOICE_CACHE);
  for (const b of blobs) await c.put(b.key, new Response(b.body, { headers: { "content-type": b.type } }));
  await c.put(VOICE_MARKER, new Response(String(Date.now())));
  emitVoiceChange();
}

/** Removes only the voice files. Classifier, app pages and records are untouched. */
export async function removeVoicePack() {
  await caches.delete(VOICE_CACHE);
  const m = await caches.open(MODEL_CACHE_NAME);
  for (const k of await m.keys()) if (new URL(k.url).pathname.includes("/whisper-tiny/")) await m.delete(k);
  resetStt();
  emitVoiceChange();
}
