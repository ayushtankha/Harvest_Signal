// Voice input adapter: MediaRecorder capture → 16 kHz mono PCM → local Whisper.
// Audio never leaves the device and is discarded right after transcription.
import { transcribe } from "./ai";

export interface Recorder {
  stop: () => Promise<Float32Array>;
  cancel: () => void;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  const end = () => stream.getTracks().forEach((t) => t.stop());
  return {
    cancel: () => { rec.stop(); end(); chunks.length = 0; },
    stop: () =>
      new Promise((resolve, reject) => {
        rec.onstop = async () => {
          end();
          try {
            const blob = new Blob(chunks, { type: rec.mimeType });
            chunks.length = 0;
            resolve(await toPcm16k(blob));
          } catch (e) { reject(e); }
        };
        rec.stop();
      }),
  };
}

async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf);
  await ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0).slice();
}

export async function speechToText(audio: Float32Array, lang: "en" | "fr" | "de") {
  return transcribe(audio, lang); // buffer is transferred and dropped after use
}
