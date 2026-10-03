# Save voice input too before "Ready for airplane mode"

Goal: after the app says "Ready for airplane mode", turning off Wi-Fi keeps everything working, including speaking to the Visitor page. No voice output.

## Changes
1. **Download the speech model at startup** alongside the text AI, on any page (not only when Visitor opens). Files are saved on the phone the same way as the text AI.
2. **"Ready for airplane mode" waits for everything**: text AI ready, speech model ready, and all pages saved. Until then: "Still saving the app — keep Wi-Fi on", with one progress bar covering both models.
3. **Offline start**: when the app opens offline, both models load from the phone's saved copy; the Speak button works without internet.
4. **If voice can't work** (microphone blocked, or the speech model failed to save), the Visitor page still says "Voice unavailable on this device — please type", and the tick stays off with a clear reason in Settings.
5. **Settings → Offline proof**: add a line "Voice model saved: yes/no".
6. **README**: airplane-mode test includes speaking one EN, FR and DE request.

No voice output, no design changes, no new features.

## Technical details
- `src/routes/__root.tsx`: call `loadSttModel()` after `loadEmbedModel()`.
- `src/components/hs.tsx` (StatusBanner/ModelLoader): ready = `ai.embed === "ready" && ai.stt === "ready" && appSaved`; progress = average of embed and stt.
- `src/routes/settings.tsx`: voice-model line from `useAI().stt`.
- Whisper files already go through the worker's cache-first `harvestsignal-models-v1` cache; verify the encoder (public/models) and remapped decoder are both cached, then confirm offline load in an emulated Android Playwright run on the published site after publishing.
