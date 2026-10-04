// Browser-only client for the on-device AI worker. Call only from effects/handlers.
import { classifyVector, e5, type ClassificationResult, type ProtoVec, type Thresholds } from "./classifier";
import { prototypeList } from "./taxonomy";
import { getKV, setKV } from "./db";

export type ModelState = "idle" | "loading" | "ready" | "error";
export interface AIStatus {
  embed: ModelState;
  stt: ModelState;
  embedProgress: number;
  sttProgress: number;
  error?: string;
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { res: (v: unknown) => void; rej: (e: Error) => void }>();
const fileProgress: Record<"embed" | "stt", Record<string, number>> = { embed: {}, stt: {} };

export const status: AIStatus = { embed: "idle", stt: "idle", embedProgress: 0, sttProgress: 0 };
const listeners = new Set<() => void>();
const emit = () => { snapshot = { ...status }; listeners.forEach((l) => l()); };
let snapshot: AIStatus = { ...status };
export const subscribeAI = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const getAIStatus = () => snapshot;

function w() {
  if (worker) return worker;
  worker = new Worker(new URL("./ai-worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const d = e.data;
    if (d.type === "progress") {
      const m = d.model as "embed" | "stt";
      if (d.file && typeof d.progress === "number") fileProgress[m][d.file] = d.progress;
      const vals = Object.values(fileProgress[m]);
      const pct = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      if (m === "embed") status.embedProgress = pct; else status.sttProgress = pct;
      emit();
      return;
    }
    const p = pending.get(d.id);
    if (!p) return;
    pending.delete(d.id);
    if (d.ok) p.res(d.result); else p.rej(new Error(d.error));
  };
  return worker;
}

function call<T>(type: string, payload?: unknown, transfer: Transferable[] = []): Promise<T> {
  const id = ++seq;
  return new Promise<T>((res, rej) => {
    pending.set(id, { res: res as (v: unknown) => void, rej });
    w().postMessage({ id, type, payload }, transfer);
  });
}

let protos: Promise<ProtoVec[]> | null = null;

export function loadEmbedModel(): Promise<ProtoVec[]> {
  if (status.embed === "ready" || status.embed === "loading") return protos!;
  status.embed = "loading"; emit();
  protos = (async () => {
    await call("init-embed");
    const list = prototypeList();
    const key = "protovecs:" + list.length + ":" + list.map((p) => p.text).join("|").length;
    let vecs = await getKV<number[][]>(key);
    if (!vecs) {
      vecs = await call<number[][]>("embed", list.map((p) => e5(p.text)));
      await setKV(key, vecs);
    }
    status.embed = "ready"; status.embedProgress = 100; emit();
    return list.map((p, i) => ({ category: p.category, vec: vecs![i]! }));
  })().catch((err) => {
    status.embed = "error"; status.error = String(err.message ?? err); emit();
    protos = null;
    throw err;
  });
  return protos;
}

export function loadSttModel() {
  if (status.stt === "ready" || status.stt === "loading") return;
  status.stt = "loading"; emit();
  call("init-stt").then(
    () => { status.stt = "ready"; status.sttProgress = 100; emit(); },
    (err) => { status.stt = "error"; status.error = String(err.message ?? err); emit(); },
  );
}

export async function classifyText(text: string, t: Thresholds): Promise<ClassificationResult> {
  const p = await loadEmbedModel();
  const [vec] = await call<number[][]>("embed", [e5(text)]);
  return classifyVector(vec!, p, t);
}

export async function transcribe(audio: Float32Array, lang: "en" | "fr" | "de"): Promise<string> {
  return call<string>("transcribe", { audio, lang }, [audio.buffer]);
}
