// Fixed tourism taxonomy and SYNTHETIC prototype examples.
// These examples were written by hand for the prototype. They are NOT real
// visitor messages and do not cover slang, mixed-language or other languages.

export const CATEGORIES = [
  "harvest_walk",
  "coffee_tasting",
  "roasting",
  "meals",
  "prices",
  "transport",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type VisitorLang = "en" | "fr" | "de";

export const CATEGORY_ICON: Record<Category, string> = {
  harvest_walk: "🌿",
  coffee_tasting: "☕",
  roasting: "🔥",
  meals: "🍲",
  prices: "💶",
  transport: "🚐",
  other: "💬",
};

export const PROTOTYPES: Record<Category, Record<VisitorLang, string[]>> = {
  harvest_walk: {
    en: [
      "We would like to see how the coffee is picked.",
      "Can we walk through the farm during the harvest?",
      "I wanted to help pick coffee cherries in the field.",
      "Show us the coffee plants and the harvest.",
    ],
    fr: [
      "Nous voulons voir la récolte du café dans les champs.",
      "Peut-on se promener dans la plantation pendant la cueillette ?",
      "J'aimerais cueillir les cerises de café moi-même.",
      "Montrez-nous les caféiers et la récolte.",
    ],
    de: [
      "Wir möchten sehen, wie der Kaffee gepflückt wird.",
      "Können wir während der Ernte über die Farm laufen?",
      "Ich wollte beim Pflücken der Kaffeekirschen helfen.",
      "Zeigt uns die Kaffeepflanzen und die Ernte.",
    ],
  },
  coffee_tasting: {
    en: [
      "We would love to taste different coffees.",
      "A coffee tasting session would be great.",
      "Can we try the farm's coffee with an explanation of the flavours?",
      "I wanted to sample several cups of your coffee.",
    ],
    fr: [
      "Nous aimerions déguster différents cafés.",
      "Une dégustation de café serait super.",
      "Peut-on goûter le café de la ferme avec une explication des arômes ?",
      "Je voulais goûter plusieurs tasses de votre café.",
    ],
    de: [
      "Wir würden gerne verschiedene Kaffees probieren.",
      "Eine Kaffeeverkostung wäre toll.",
      "Können wir den Kaffee der Farm mit Erklärung der Aromen probieren?",
      "Ich wollte mehrere Tassen eures Kaffees kosten.",
    ],
  },
  roasting: {
    en: [
      "I want to see how the beans are roasted.",
      "Can we watch the coffee roasting process?",
      "Show us how you roast the coffee beans.",
      "I would like to try roasting coffee myself.",
    ],
    fr: [
      "Je veux voir comment les grains sont torréfiés.",
      "Peut-on regarder la torréfaction du café ?",
      "Montrez-nous comment vous torréfiez les grains.",
      "J'aimerais torréfier du café moi-même.",
    ],
    de: [
      "Ich möchte sehen, wie die Bohnen geröstet werden.",
      "Können wir beim Kaffeerösten zuschauen?",
      "Zeigt uns, wie ihr die Kaffeebohnen röstet.",
      "Ich würde gerne selbst Kaffee rösten.",
    ],
  },
  meals: {
    en: [
      "We wanted to eat a local lunch at the farm.",
      "The food was delicious, more home cooking please.",
      "Can you offer traditional meals for visitors?",
      "We were hungry, a breakfast would be nice.",
    ],
    fr: [
      "Nous voulions manger un déjeuner local à la ferme.",
      "La nourriture était délicieuse, plus de cuisine maison.",
      "Pouvez-vous proposer des repas traditionnels ?",
      "Nous avions faim, un petit-déjeuner serait bien.",
    ],
    de: [
      "Wir wollten ein lokales Mittagessen auf der Farm essen.",
      "Das Essen war lecker, bitte mehr Hausmannskost.",
      "Könnt ihr traditionelle Mahlzeiten anbieten?",
      "Wir hatten Hunger, ein Frühstück wäre schön.",
    ],
  },
  prices: {
    en: [
      "How much does the tour cost?",
      "The visit was too expensive.",
      "Please show the prices clearly.",
      "Is there a cheaper option for families?",
    ],
    fr: [
      "Combien coûte la visite ?",
      "La visite était trop chère.",
      "Merci d'afficher les prix clairement.",
      "Y a-t-il un tarif moins cher pour les familles ?",
    ],
    de: [
      "Wie viel kostet die Tour?",
      "Der Besuch war zu teuer.",
      "Bitte zeigt die Preise deutlich an.",
      "Gibt es eine günstigere Option für Familien?",
    ],
  },
  transport: {
    en: [
      "It was hard to find a way to get to the farm.",
      "Can you pick us up from the town?",
      "Is there a bus or taxi to the farm?",
      "The road was difficult, we need transport.",
    ],
    fr: [
      "C'était difficile de venir jusqu'à la ferme.",
      "Pouvez-vous venir nous chercher en ville ?",
      "Y a-t-il un bus ou un taxi pour la ferme ?",
      "La route était difficile, il faut un transport.",
    ],
    de: [
      "Es war schwer, zur Farm zu kommen.",
      "Könnt ihr uns in der Stadt abholen?",
      "Gibt es einen Bus oder ein Taxi zur Farm?",
      "Die Straße war schwierig, wir brauchen Transport.",
    ],
  },
  other: {
    en: [
      "Thank you for everything.",
      "The weather was nice today.",
      "My phone battery died.",
      "Hello.",
    ],
    fr: [
      "Merci pour tout.",
      "Il faisait beau aujourd'hui.",
      "La batterie de mon téléphone est vide.",
      "Bonjour.",
    ],
    de: [
      "Danke für alles.",
      "Das Wetter war heute schön.",
      "Mein Handyakku war leer.",
      "Hallo.",
    ],
  },
};

export function prototypeList(): { category: Category; lang: VisitorLang; text: string }[] {
  const out: { category: Category; lang: VisitorLang; text: string }[] = [];
  for (const c of CATEGORIES)
    for (const l of ["en", "fr", "de"] as VisitorLang[])
      for (const t of PROTOTYPES[c][l]) out.push({ category: c, lang: l, text: t });
  return out;
}

export const DEMO_MESSAGES: { lang: VisitorLang; text: string }[] = [
  { lang: "en", text: "We would love to see how the coffee is harvested." },
  { lang: "fr", text: "Nous aimerions voir comment le café est récolté." },
  { lang: "de", text: "Wir würden gerne sehen, wie der Kaffee geerntet wird." },
];

/** Deterministic ambiguous message: with the default thresholds the real model
 *  scores coffee tasting 0.846 vs transport 0.843 (margin < 0.012) → "Not sure". */
export const AMBIGUOUS_DEMO: { lang: VisitorLang; text: string } = {
  lang: "en",
  text: "Can I pay by card for the coffee tasting and the taxi?",
};
