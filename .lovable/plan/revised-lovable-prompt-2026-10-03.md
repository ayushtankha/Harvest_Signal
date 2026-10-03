Absolutely. I would revise the Lovable plan so the product is **voice-or-text input → local AI → text output in Noor's local language**, while keeping the architecture honest about what is actually offline.

One important change from the previous prompt: **do not use ElevenLabs or browser TTS in the main flow**. The output is text in the operator's local language, exactly as you requested.

## Revised Lovable prompt

```text
Build and refine the existing HarvestSignal app as an offline-first Small AI prototype for the World Bank × Hack-Nation “Small AI for Development” hackathon, Tourism track.

CORE IDEA

HarvestSignal helps Noor, a small tourism/farm operator, understand what foreign visitors actually want from her experience.

Visitors can give feedback in either:
1. VOICE, or
2. TEXT

The input can be in English, French, or German.

The app processes the input locally on the device, maps semantically similar feedback to a fixed tourism category, and detects recurring demand.

When at least 3 separate visitor submissions match the same category, Noor sees an Opportunity card.

The output for Noor is TEXT in her named local language (prototype localization: Albanian).

The AI only informs Noor. It never automatically publishes, contacts visitors, books anything, or makes a business decision.

IMPORTANT HACKATHON CONSTRAINTS

- Core feature must work offline.
- No backend.
- No cloud AI in the main workflow.
- No accounts.
- No cloud database.
- No external CDN at runtime.
- App runs on device already available to the user.
- Model files are stored locally and can be cached for weak/intermittent connectivity.
- At least one interaction is in a named local language.
- Human remains in the loop.
- Never guess when uncertain.
- Keep outputs constrained and explainable.
- The main AI path must work in airplane mode after the first online load/cache.

PRODUCT FLOW

VISITOR

1. Visitor opens Visitor mode.
2. They choose:
   - English
   - Français
   - Deutsch
3. They can provide feedback either by:
   - typing a short message, OR
   - recording a short voice message.
4. The app processes the input locally.
5. Voice input is converted to text using an OFFLINE speech-to-text layer.
6. Text is embedded using the local multilingual embedding model.
7. The message is classified against the fixed tourism taxonomy.
8. The result is stored locally.
9. Show a simple “Thank you” state.

VOICE INPUT

Voice input is part of the intended user experience.

Use:
- MediaRecorder for capturing microphone input.
- A local/offline speech-to-text model running on-device.
- Inference must happen locally.
- Do NOT use the browser Web Speech API.
- Do NOT call a cloud transcription API.
- Do NOT send recorded audio to a server.

Create a speech recognition adapter/module such as:

src/lib/speech.ts

so the speech model implementation is isolated from the rest of the app.

If the speech model cannot be loaded yet, keep text input fully functional and clearly label voice as unavailable rather than pretending it is offline.

Do not block the rest of the application while the speech model loads.

TEXT INPUT

Text input must remain a first-class input method.

The classification pipeline should be identical after voice has been converted into text:

voice → local STT → text
text → text

Both then enter the same classifier.

CORE AI ARCHITECTURE

Use a small pretrained multilingual embedding model locally:

Xenova/multilingual-e5-small

Use the quantized ONNX model with Transformers.js.

Do NOT train a model from scratch.

Do NOT require Anthropic, ElevenLabs, or another cloud AI provider at runtime.

Configure Transformers.js for local model usage:
- allowRemoteModels = false
- allowLocalModels = true
- model files served from /public/models/

Run inference in a Web Worker so the UI remains responsive.

CLASSIFICATION

Fixed editable taxonomy:

- harvest walk
- coffee tasting
- roasting
- meals
- prices
- transport
- other

For each category, create 8–15 prototype examples in:
- English
- French
- German

These prototype examples are synthetic and must be documented as synthetic.

Use the E5 query prefix:
“query: ”

For both:
- incoming visitor messages
- category prototype examples

Precompute category prototype embeddings once and cache them in IndexedDB.

For a new message:

1. Generate its embedding locally.
2. Compare against category prototype embeddings using cosine similarity.
3. Compute one score per category using the mean of the top 3 prototype similarities.
4. Identify the highest-scoring category.
5. Compare the best score with the second-best score.
6. Return a category only when:
   - best score >= minScore
   - best score - secondBestScore >= minMargin
7. Otherwise return:
   “Not sure.”

Do not force every message into a category.

THRESHOLDS

Make minScore and minMargin configurable in Settings.

Do not invent confidence labels such as “medium confidence”.

Confidence/evidence shown to Noor must be based on explicit metrics:
- number of submissions
- average similarity
- languages represented

Thresholds should be calibrated against a small labeled test set and documented in the README.

OPPORTUNITY LOGIC

Each visitor submission is one anonymous feedback session.

Do not claim to know a visitor’s real identity.

The same visitor should ideally not be able to inflate the opportunity count with repeated submissions in one session.

For the MVP, represent each visitor session with a random local session ID.

Do NOT collect:
- name
- email
- phone number
- account information
- identifying profile information

Opportunity rule:

A category becomes an opportunity after >= 3 separate visitor submissions for that category within the current season window.

Default season window:
90 days.

Make the window editable in Settings.

Show COUNTS ONLY, not percentages.

Example:

Harvest Walk — 3 submissions

Never automatically publish or send anything.

NOOR DASHBOARD

Main status banner:

“Offline — core AI is working on this device”

Show:

Visitor feedback
Current season

Category counts:

Harvest Walk      3
Coffee Tasting    1
Roasting          1
Meals             0
Prices             1
Transport          0

When a category reaches the opportunity threshold:

NEW OPPORTUNITY

Harvest Walk

3 visitor submissions

Evidence:
- 3 submissions
- average similarity: [actual value]
- languages detected: English, French, German

The output shown to Noor should be available in the prototype local language:

ALBANIAN

This is a prototype localization choice and should not be presented as the fictional scenario’s official language.

OPPORTUNITY ACTIONS

Buttons:

[ Create Tour ]
[ Edit ]
[ Dismiss ]

Nothing happens automatically.

CREATE TOUR

Create Tour must use a fixed template, NOT free-form generative AI.

Example:

TITLE
Coffee Harvest Walk

DURATION
45 minutes

DESCRIPTION
A short predefined tourism draft based only on the selected category.

INCLUDES
- Farm walk
- See the coffee harvesting process
- Ask questions about the farm

STATUS
Draft — review before offering

Buttons:

[ Edit ]
[ Save Draft ]

Display:

“Nothing is published automatically.”

LOCAL-LANGUAGE OUTPUT

Do NOT use text-to-speech for the main output.

Do NOT use ElevenLabs at runtime.

Show Noor’s dashboard, opportunity cards, explanations, and fixed draft content as TEXT in the selected local-language interface.

Prototype local language:
Albanian.

Example:

“3 vizitorë kanë kërkuar një shëtitje gjatë korrjes.”

Only use fixed/predefined translations for the UI and fixed opportunity messages.

Do not use unrestricted AI generation for translations.

PRIVACY

Use IndexedDB for local storage.

Store only:
- random session ID
- category
- score
- timestamp
- language
- top-2 scores
- minimal classification metadata

Do not store raw audio after transcription.

Audio should be deleted after successful local transcription.

Provide:

[ Delete all data ]

Optional:
[ Set PIN ]

Privacy text:

“Your feedback stays on this device.
No names or contact details are collected.
Voice recordings are deleted after local transcription.
You can delete all stored data.”

Explain what happens if the device is lost:
- data remains only on the device
- no cloud copy exists
- optional PIN protects access
- deleting local app data removes stored feedback

OFFLINE ARCHITECTURE

Use:
- Service Worker
- IndexedDB
- local model files
- local audio/assets
- local WASM/ONNX runtime files

Pre-cache:
- app shell
- embedding model
- speech model
- tokenizer files
- ONNX/WASM files
- fixed local-language assets

The core classification flow must function with the network completely disabled.

Create an offline proof panel showing actual browser state:

- Model loaded locally ✓
- Speech model loaded locally ✓/not loaded
- Service worker active ✓
- Cached model files
- Network status
- IndexedDB record count
- Cached app version

Do not fake any of these values.

SCREENS

1. Welcome
- large Offline / Model Ready status
- Visitor button
- Noor button

2. Visitor
- EN / FR / DE selector
- Voice input button
- Text input
- Example prompts
- Send / Submit
- Thank you state

3. Noor Dashboard
- offline banner
- current season counts
- opportunity cards
- not-sure / insufficient-data state

4. Opportunity Detail
- category
- submission count
- similarity evidence
- languages detected
- Albanian text output
- Create Tour
- Edit
- Dismiss

5. Create Tour
- fixed editable template
- draft status
- save locally

6. Settings / Privacy
- local language
- season window
- category names
- classification thresholds
- privacy
- delete all data
- offline proof

7. Demo
- reset demo
- one-tap insertion of prepared EN/FR/DE examples

VISUAL DESIGN

Use:
- warm earthy farm palette
- deep coffee brown
- cream
- leaf green
- harvest amber
- large rounded serif headings
- sturdy sans-serif body
- oversized touch targets
- strong icons
- high contrast
- minimal reading
- older-user friendly
- no chatbot appearance

DEMO MODE

Demo sequence:

1. Show offline indicator.
2. Put device in airplane mode.
3. Submit English voice or text:
   “We would love to see how the coffee is harvested.”
4. Submit French:
   “Nous aimerions voir comment le café est récolté.”
5. Submit German:
   “Wir würden gerne sehen, wie der Kaffee geerntet wird.”
6. All three classify as Harvest Walk.
7. Count becomes 3.
8. Opportunity card appears.
9. Noor sees the opportunity in Albanian.
10. Tap Create Tour.
11. Fixed draft appears.
12. Reset demo.
13. Submit one ambiguous/off-topic message.
14. Show:
   “Not enough data — ask a visitor.”
   or
   “Not sure.”

TESTS

Add automated tests for:

- English/French/German harvest messages → Harvest Walk
- single submission does not trigger opportunity
- 2 submissions does not trigger opportunity
- 3 submissions triggers opportunity
- ambiguous message → Not sure
- low similarity → Not sure
- duplicate submissions from same anonymous visitor session do not falsely create extra visitor count
- app classification works without network once models are cached

README

Document:
- problem
- Noor scenario
- tourism track
- why AI is needed
- architecture
- local/offline design
- embedding model
- speech model
- model sizes
- licenses
- synthetic prototype data
- test dataset
- what data does NOT cover
- known limitations
- privacy
- guardrails
- airplane-mode testing

Be explicit that:
- prototype category examples are synthetic
- we do not have real farm-visit feedback data
- slang is not covered
- mixed-language messages are not covered
- low-resource languages may have lower accuracy
- speaker identity is not inferred
- voice transcription may fail in noisy environments
- the app says “not sure” rather than guessing

OUT OF SCOPE

Do NOT add:
- accounts
- payments
- maps
- online bookings
- WhatsApp
- SMS
- cloud database
- cloud AI
- cloud speech recognition
- cloud translation
- unrestricted LLM generation
- automatic publishing
- automatic messaging
- speaker recognition / biometric identification

PRIORITY

Implement in this order:

1. Local multilingual text classification
2. Not-sure logic
3. Opportunity threshold
4. Noor dashboard
5. Local-language text output
6. Offline caching
7. Offline speech-to-text input
8. Privacy and deletion
9. Demo mode
10. Tests
11. Visual polish

The goal is a simple, reliable Small AI prototype that demonstrates the core workflow completely offline.
```

### One conceptual clarification

The revised architecture is now:

**Voice OR text**  
↓  
**local speech-to-text if voice**  
↓  
**multilingual E5 embedding**  
↓  
**fixed tourism taxonomy**  
↓  
**similarity + threshold + margin**  
↓  
**anonymous local submission**  
↓  
**3 submissions**  
↓  
**Opportunity**  
↓  
**Noor sees text in local language**  
↓  
**Noor decides**

That keeps the two AI jobs separate: **speech recognition** handles voice input, while **E5** handles multilingual semantic classification. The World Bank brief supports voice as an interface and requires at least one local-language interaction by voice or text, while leaving the particular model choice to the team.

One thing I would **not** put into Lovable yet is a hard-coded speech model name. We should choose the offline STT model separately, because that model has different size/device/licensing tradeoffs from E5.