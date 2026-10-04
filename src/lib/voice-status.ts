// Tiny, always-loaded helpers for the optional offline voice pack.
// The pack lives in its own cache so removing it never touches the core app.
import whisperDec from "@/assets/models/whisper-decoder.asset.json";

export const VOICE_CACHE = "harvestsignal-voice-v1";
export const VOICE_MARKER = "/__voice_installed";
const W = "/models/Xenova/whisper-tiny/";

/** Every file Whisper-tiny needs, with exact byte sizes (verified after download). */
export const VOICE_FILES: { key: string; src: string; size: number }[] = [
  { key: W + "config.json", src: W + "config.json", size: 2248 },
  { key: W + "generation_config.json", src: W + "generation_config.json", size: 3716 },
  { key: W + "preprocessor_config.json", src: W + "preprocessor_config.json", size: 339 },
  { key: W + "tokenizer.json", src: W + "tokenizer.json", size: 2480466 },
  { key: W + "tokenizer_config.json", src: W + "tokenizer_config.json", size: 282683 },
  { key: W + "onnx/encoder_model_quantized.onnx", src: W + "onnx/encoder_model_quantized.onnx", size: 10124910 },
  { key: W + "onnx/decoder_model_merged_quantized.onnx", src: whisperDec.url, size: whisperDec.size },
];
export const VOICE_PACK_BYTES = VOICE_FILES.reduce((s, f) => s + f.size, 0);
export const isVoicePath = (p: string) => p.startsWith(W);

export async function isVoiceInstalled(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  const c = await caches.open(VOICE_CACHE);
  if (!(await c.match(VOICE_MARKER))) return false;
  for (const f of VOICE_FILES) if (!(await c.match(f.key))) return false;
  return true;
}

const listeners = new Set<() => void>();
export const onVoiceChange = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const emitVoiceChange = () => listeners.forEach((l) => l());
