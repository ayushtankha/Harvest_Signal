import type { Settings } from "./db";
import type { Category } from "./taxonomy";
import { CATEGORY_NAME, type NoorLang } from "./i18n";

export const catName = (c: Category, s: Settings) => s.categoryNames[c] || CATEGORY_NAME[s.noorLang as NoorLang][c];
