// Fixed, predefined translations only. No AI-generated text.
import type { Category, VisitorLang } from "./taxonomy";

export type NoorLang = "sq" | "en";

export const CATEGORY_NAME: Record<NoorLang, Record<Category, string>> = {
  sq: {
    harvest_walk: "Shëtitje në korrje",
    coffee_tasting: "Shijim kafeje",
    roasting: "Pjekja e kafes",
    meals: "Ushqime",
    prices: "Çmimet",
    transport: "Transporti",
    other: "Tjetër",
  },
  en: {
    harvest_walk: "Harvest walk",
    coffee_tasting: "Coffee tasting",
    roasting: "Roasting",
    meals: "Meals",
    prices: "Prices",
    transport: "Transport",
    other: "Other",
  },
};

/** Fixed sentence: "N separate visitor submissions asked about X" in Noor's language. */
export const INSIGHT: Record<NoorLang, Record<Category, (n: number) => string>> = {
  sq: {
    harvest_walk: (n) => `${n} vizitorë kanë kërkuar një shëtitje gjatë korrjes.`,
    coffee_tasting: (n) => `${n} vizitorë kanë kërkuar të shijojnë kafenë.`,
    roasting: (n) => `${n} vizitorë kanë kërkuar të shohin pjekjen e kafes.`,
    meals: (n) => `${n} vizitorë kanë kërkuar ushqime vendore.`,
    prices: (n) => `${n} vizitorë kanë pyetur për çmimet.`,
    transport: (n) => `${n} vizitorë kanë pyetur për transportin.`,
    other: (n) => `${n} vizitorë kanë lënë mesazhe të tjera.`,
  },
  en: {
    harvest_walk: (n) => `${n} separate visitor submissions asked for a walk during the harvest.`,
    coffee_tasting: (n) => `${n} separate visitor submissions asked to taste the coffee.`,
    roasting: (n) => `${n} separate visitor submissions asked to see the roasting.`,
    meals: (n) => `${n} separate visitor submissions asked for local meals.`,
    prices: (n) => `${n} separate visitor submissions asked about prices.`,
    transport: (n) => `${n} separate visitor submissions asked about transport.`,
    other: (n) => `${n} separate visitor submissions left other messages.`,
  },
};

export const LANG_NAME: Record<NoorLang, Record<VisitorLang, string>> = {
  sq: { en: "anglisht", fr: "frëngjisht", de: "gjermanisht" },
  en: { en: "English", fr: "French", de: "German" },
};

export const T = {
  sq: {
    offline: "Offline — AI kryesore punon në këtë pajisje",
    online: "Online — AI punon në këtë pajisje, pa internet",
    feedback: "Mendimet e vizitorëve",
    season: "Sezoni aktual",
    days: "ditë",
    newOpp: "MUNDËSI E RE",
    submissions: "mendime",
    notEnough: "Nuk ka mjaft të dhëna — pyet një vizitor.",
    notSure: "I pasigurt",
    evidence: "Prova",
    avgSim: "Ngjashmëria mesatare",
    languages: "Gjuhët",
    createTour: "Krijo turin",
    edit: "Ndrysho",
    dismiss: "Hiq",
    open: "Shiko",
    draft: "Draft — kontrollo para se ta ofrosh",
    nothingPublished: "Asgjë nuk publikohet automatikisht.",
    title: "Titulli",
    duration: "Kohëzgjatja",
    description: "Përshkrimi",
    includes: "Përfshin",
    saveDraft: "Ruaj draftin",
    saved: "U ruajt në këtë pajisje",
    back: "Mbrapa",
    settings: "Cilësimet",
    noorDecides: "AI vetëm të informon. Ti vendos.",
  },
  en: {
    offline: "Offline — core AI is working on this device",
    online: "Online — AI runs on this device, no internet needed",
    feedback: "Visitor feedback",
    season: "Current season",
    days: "days",
    newOpp: "NEW OPPORTUNITY",
    submissions: "submissions",
    notEnough: "Not enough data — ask a visitor.",
    notSure: "Not sure",
    evidence: "Evidence",
    avgSim: "Average similarity",
    languages: "Languages",
    createTour: "Create Tour",
    edit: "Edit",
    dismiss: "Dismiss",
    open: "Open",
    draft: "Draft — review before offering",
    nothingPublished: "Nothing is published automatically.",
    title: "Title",
    duration: "Duration",
    description: "Description",
    includes: "Includes",
    saveDraft: "Save Draft",
    saved: "Saved on this device",
    back: "Back",
    settings: "Settings",
    noorDecides: "The AI only informs. You decide.",
  },
} satisfies Record<NoorLang, Record<string, string>>;

type VKeys = "header" | "placeholder" | "send" | "speak" | "stop" | "listening" | "transcribing" | "thanks" | "another" | "voiceOff" | "voiceNo" | "privacy";
export const VISITOR_T: Record<VisitorLang, Record<VKeys, string>> = {
  en: {
    header: "Tell Noor what you loved or wanted to see.",
    placeholder: "Type a short message…",
    send: "Send",
    speak: "Speak",
    stop: "Stop",
    listening: "Listening…",
    transcribing: "Writing down…",
    thanks: "Thank you",
    another: "Next visitor",
    voiceOff: "Voice not available yet — please type",
    voiceNo: "Voice unavailable on this device — please type",
    privacy: "No names. Stays on this device.",
  },
  fr: {
    header: "Dites à Noor ce que vous avez aimé ou voulu voir.",
    placeholder: "Écrivez un court message…",
    send: "Envoyer",
    speak: "Parler",
    stop: "Arrêter",
    listening: "J'écoute…",
    transcribing: "Transcription…",
    thanks: "Merci",
    another: "Visiteur suivant",
    voiceOff: "Voix pas encore disponible — écrivez",
    voiceNo: "Voix indisponible sur cet appareil — écrivez",
    privacy: "Aucun nom. Reste sur cet appareil.",
  },
  de: {
    header: "Sag Noor, was dir gefallen hat oder was du sehen wolltest.",
    placeholder: "Kurze Nachricht schreiben…",
    send: "Senden",
    speak: "Sprechen",
    stop: "Stopp",
    listening: "Ich höre zu…",
    transcribing: "Wird aufgeschrieben…",
    thanks: "Danke",
    another: "Nächster Besuch",
    voiceOff: "Sprache noch nicht verfügbar — bitte tippen",
    privacy: "Keine Namen. Bleibt auf diesem Gerät.",
  },
};

/** Fixed Create-Tour templates (no generative AI). */
export const TOUR_TEMPLATE: Record<NoorLang, Record<Exclude<Category, "other">, { title: string; duration: string; description: string; includes: string[] }>> = {
  sq: {
    harvest_walk: { title: "Shëtitje në korrjen e kafes", duration: "45 minuta", description: "Një shëtitje e qetë nëpër fermë gjatë sezonit të korrjes.", includes: ["Shëtitje në fermë", "Shiko si korret kafeja", "Bëj pyetje për fermën"] },
    coffee_tasting: { title: "Shijim kafeje në fermë", duration: "30 minuta", description: "Shijo disa lloje kafeje nga ferma me shpjegime të thjeshta.", includes: ["3 filxhanë kafe", "Shpjegim i shijeve", "Pyetje dhe përgjigje"] },
    roasting: { title: "Pjekja e kafes", duration: "40 minuta", description: "Shiko si piqen kokrrat e kafes, nga e gjelbra në kafe.", includes: ["Demonstrim pjekjeje", "Erë dhe ngjyrë e kokrrave", "Pyetje për procesin"] },
    meals: { title: "Drekë vendore në fermë", duration: "60 minuta", description: "Një vakt i thjeshtë shtëpie me produkte vendore.", includes: ["Drekë shtëpie", "Pije vendore", "Bisedë me familjen"] },
    prices: { title: "Paketë vizite me çmim të qartë", duration: "60 minuta", description: "Një vizitë me çmim të qartë dhe të shkruar.", includes: ["Çmim i shkruar", "Shëtitje në fermë", "Një filxhan kafe"] },
    transport: { title: "Vizitë me marrje nga qyteti", duration: "2 orë", description: "Vizitë në fermë me transport nga qyteti dhe kthim.", includes: ["Marrje nga qyteti", "Vizitë në fermë", "Kthim në qytet"] },
  },
  en: {
    harvest_walk: { title: "Coffee Harvest Walk", duration: "45 minutes", description: "A calm walk through the farm during harvest season.", includes: ["Farm walk", "See the coffee harvesting process", "Ask questions about the farm"] },
    coffee_tasting: { title: "Farm Coffee Tasting", duration: "30 minutes", description: "Taste several farm coffees with simple explanations.", includes: ["3 cups of coffee", "Flavour explanation", "Questions and answers"] },
    roasting: { title: "Coffee Roasting", duration: "40 minutes", description: "Watch green beans become roasted coffee.", includes: ["Roasting demonstration", "Smell and colour of the beans", "Questions about the process"] },
    meals: { title: "Local Farm Lunch", duration: "60 minutes", description: "A simple home-cooked meal with local produce.", includes: ["Home-cooked lunch", "Local drink", "Talk with the family"] },
    prices: { title: "Clear-Price Visit", duration: "60 minutes", description: "A visit with one clear, written price.", includes: ["Written price", "Farm walk", "One cup of coffee"] },
    transport: { title: "Visit with Town Pickup", duration: "2 hours", description: "Farm visit with pickup from town and return.", includes: ["Pickup from town", "Farm visit", "Return to town"] },
  },
};
