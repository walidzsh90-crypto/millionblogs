import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en/common.json").then((module) => module.default),
  ar: () => import("./dictionaries/ar/common.json").then((module) => module.default),
  nl: () => import("./dictionaries/nl/common.json").then((module) => module.default)
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
