// Independent evaluation set. SEPARATE from the prototypes in taxonomy.ts, the
// demo messages and the messages used to tune minScore/minMargin. Never use it
// to tune thresholds. All messages are synthetic (hand-written for this check),
// not real visitor messages.
import type { Category, VisitorLang } from "./taxonomy";

export interface EvalRecord {
  id: string;
  lang: VisitorLang;
  text: string;
  /** Expected category; null when "Not sure" is the expected outcome. */
  expected: Category | null;
  expectNotSure: boolean;
  source: "synthetic" | "human-written";
}

const r = (id: string, lang: VisitorLang, text: string, expected: Category | null): EvalRecord => ({
  id, lang, text, expected, expectNotSure: expected === null, source: "synthetic",
});

export const EVAL_SET: EvalRecord[] = [
  r("hw-en-1", "en", "Could we join the pickers in the coffee field tomorrow morning?", "harvest_walk"),
  r("hw-fr-1", "fr", "On aimerait participer à la cueillette avec les ouvriers.", "harvest_walk"),
  r("hw-de-1", "de", "Wir hätten gern eine Führung durch die Kaffeefelder zur Erntezeit.", "harvest_walk"),
  r("hw-en-2", "en", "A guided walk among the coffee trees would be amazing.", "harvest_walk"),
  r("ct-en-1", "en", "We'd enjoy comparing the flavours of a few brews side by side.", "coffee_tasting"),
  r("ct-fr-1", "fr", "Une petite séance pour goûter vos différents cafés, ce serait génial.", "coffee_tasting"),
  r("ct-de-1", "de", "Wir möchten gern die Geschmacksnoten eurer Kaffeesorten vergleichen.", "coffee_tasting"),
  r("ct-de-2", "de", "Eine Probe mit drei verschiedenen Tassen wäre schön.", "coffee_tasting"),
  r("ro-en-1", "en", "How do the green beans turn brown? We'd like to watch that.", "roasting"),
  r("ro-fr-1", "fr", "Nous voulons voir la machine de torréfaction en marche.", "roasting"),
  r("ro-de-1", "de", "Kann man zusehen, wie die grünen Bohnen braun gebrannt werden?", "roasting"),
  r("ro-fr-2", "fr", "Est-ce qu'on peut griller nos propres grains ?", "roasting"),
  r("me-en-1", "en", "A home-cooked dinner with the family would be lovely.", "meals"),
  r("me-fr-1", "fr", "On voudrait goûter la cuisine locale pour le dîner.", "meals"),
  r("me-de-1", "de", "Gibt es hier etwas Warmes zum Abendessen?", "meals"),
  r("me-en-2", "en", "Please serve some local food after the visit.", "meals"),
  r("pr-en-1", "en", "What is the fee per person for a visit?", "prices"),
  r("pr-fr-1", "fr", "Quel est le tarif pour deux adultes et un enfant ?", "prices"),
  r("pr-de-1", "de", "Was kostet der Eintritt pro Person?", "prices"),
  r("pr-de-2", "de", "Für Studenten war es leider zu teuer.", "prices"),
  r("tr-en-1", "en", "Is there a shuttle from the village to the farm?", "transport"),
  r("tr-fr-1", "fr", "Comment venir ici sans voiture ?", "transport"),
  r("tr-de-1", "de", "Wir haben den Weg kaum gefunden, ein Shuttle wäre gut.", "transport"),
  r("tr-fr-2", "fr", "Pouvez-vous nous ramener à la gare après la visite ?", "transport"),
  r("ot-en-1", "en", "Thanks, we had a lovely afternoon.", "other"),
  r("ot-fr-1", "fr", "Votre chien est adorable.", "other"),
  r("ot-de-1", "de", "Schöne Grüße aus Hamburg!", "other"),
  r("ot-en-2", "en", "Nice to meet you all.", "other"),
  // Ambiguous / multi-intent: should give "Not sure".
  r("ns-en-1", "en", "How much is the roasting class and is lunch included?", null),
  r("ns-fr-1", "fr", "On veut manger et aussi visiter les champs, et c'est combien ?", null),
  r("ns-de-1", "de", "Kaffee probieren und danach ein Taxi in die Stadt, geht das?", null),
  r("ns-en-2", "en", "Can you drive us to the tasting and then to dinner?", null),
  r("ns-fr-2", "fr", "La dégustation, la torréfaction, tout nous intéresse.", null),
  r("ns-de-2", "de", "Was kostet die Erntetour inklusive Abholung?", null),
  // Off-topic: should give "Not sure" (or at least never a tourism category).
  r("ns-en-3", "en", "Where can I charge an electric scooter battery?", null),
  r("ns-fr-3", "fr", "Le wifi ne marche pas dans ma chambre.", null),
  r("ns-de-3", "de", "Mein Visum läuft nächste Woche ab.", null),
  r("ns-en-4", "en", "Do you know a good dentist nearby?", null),
  r("ns-fr-4", "fr", "Quel temps fera-t-il demain à la plage ?", null),
  r("ns-de-4", "de", "Ich suche eine Apotheke.", null),
];
