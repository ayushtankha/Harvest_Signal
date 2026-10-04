/// <reference lib="webworker" />
// Runs all AI inference on-device. No cloud calls: remote model loading is
// disabled and every file is read from this app's own origin, then kept in
// Cache Storage so it works offline afterwards.
// Core (text) files: "harvestsignal-models-v1". Optional voice pack: read ONLY
// from "harvestsignal-voice-v1" (installed from Settings); never fetched here.
import { env, pipeline } from "@huggingface/transformers";
import e5Model from "@/assets/models/e5-model.asset.json";
import e5Tok from "@/assets/models/e5-tokenizer.asset.json";
import ortWasm from "@/assets/models/ort-wasm-plain.asset.json";
import ortMjs from "../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url";
import { VOICE_CACHE, isVoicePath } from "./voice-status";

export const MODEL_CACHE = "harvestsignal-models-v1";
const ORT_WASM_KEY = "/ort/ort-wasm-simd-threaded.wasm";

// Large files live in the app's asset store (same origin) under other paths.
const REMAP: Record<string, string> = {
  "/models/Xenova/multilingual-e5-small/onnx/model_quantized.onnx": e5Model.url,
  "/models/Xenova/multilingual-e5-small/tokenizer.json": e5Tok.url,
  [ORT_WASM_KEY]: ortWasm.url,
};

const realFetch = self.fetch.bind(self);
const localFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, self.location.origin);
  if (url.origin !== self.location.origin) {
    throw new Error(`Blocked non-local request: ${url.href}`);
  }
  if (!url.pathname.startsWith("/models/") && !url.pathname.startsWith("/ort/")) return realFetch(input, init);
  const key = url.pathname;
  if (isVoicePath(key)) {
    const hit = await (await caches.open(VOICE_CACHE)).match(key);
    if (hit) return hit;
    return new Response("voice pack not installed", { status: 404 });
  }
  const cache = await caches.open(MODEL_CACHE);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await realFetch(REMAP[key] ?? key);
  if (res.ok) await cache.put(key, res.clone());
  return res;
};

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/models/";
env.useBrowserCache = false;
(env as unknown as { fetch: typeof fetch }).fetch = localFetch as typeof fetch;
self.fetch = localFetch as typeof fetch;
(env as unknown as { useWasmCache: boolean }).useWasmCache = false;
const wasm = env.backends.onnx.wasm!;
wasm.wasmPaths = { mjs: ortMjs, wasm: ORT_WASM_KEY } as never;
wasm.numThreads = 1;

type Msg = { id: number; type: "init-embed" | "embed" | "init-stt" | "transcribe" | "reset-stt"; payload?: unknown };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedder: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stt: Promise<any> | null = null;

const progress = (model: string) => (p: { status: string; file?: string; progress?: number }) =>
  self.postMessage({ type: "progress", model, file: p.file, status: p.status, progress: p.progress });

function getEmbedder() {
  embedder ??= pipeline("feature-extraction", "Xenova/multilingual-e5-small", {
    dtype: "q8", device: "wasm", progress_callback: progress("embed"),
  });
  return embedder;
}
function getStt() {
  stt ??= pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
    dtype: { encoder_model: "q8", decoder_model_merged: "q8" }, device: "wasm", progress_callback: progress("stt"),
  });
  return stt;
}

const LANG = { en: "english", fr: "french", de: "german" } as const;

// One-time cleanup of files earlier versions stored in the core cache
// (old engine variant and voice files now living in the optional pack).
caches.open(MODEL_CACHE).then(async (c) => {
  for (const k of await c.keys()) {
    const p = new URL(k.url).pathname;
    if (p.includes("/whisper-tiny/") || p.endsWith(".jsep.wasm")) await c.delete(k);
  }
}).catch(() => {});

self.onmessage = async (e: MessageEvent<Msg>) => {
  const { id, type, payload } = e.data;
  try {
    let result: unknown = null;
    if (type === "init-embed") await getEmbedder();
    else if (type === "init-stt") await getStt();
    else if (type === "reset-stt") stt = null;
    else if (type === "embed") {
      const ex = await getEmbedder();
      const out = await ex(payload as string[], { pooling: "mean", normalize: true });
      result = out.tolist();
    } else if (type === "transcribe") {
      const { audio, lang } = payload as { audio: Float32Array; lang: keyof typeof LANG };
      const asr = await getStt();
      const out = await asr(audio, { language: LANG[lang], task: "transcribe" });
      result = (Array.isArray(out) ? out[0].text : out.text).trim();
    }
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    if (type === "init-embed") embedder = null;
    if (type === "init-stt") stt = null;
    self.postMessage({ id, ok: false, error: String((err as Error)?.message ?? err) });
  }
};
