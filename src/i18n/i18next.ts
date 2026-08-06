/* Hermes has no `Intl.PluralRules`, and i18next answers a missing one with
`count === 1 ? one : other`, for every language and without a warning. */
import "@formatjs/intl-pluralrules/polyfill-force.js";
/* No regional data is published; `pt-BR` and `zh-Hans` resolve through these. */
import "@formatjs/intl-pluralrules/locale-data/de.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/es.js";
import "@formatjs/intl-pluralrules/locale-data/fr.js";
import "@formatjs/intl-pluralrules/locale-data/ja.js";
import "@formatjs/intl-pluralrules/locale-data/ko.js";
import "@formatjs/intl-pluralrules/locale-data/pt.js";
import "@formatjs/intl-pluralrules/locale-data/zh.js";

import de from "@/i18n/locales/de";
import en from "@/i18n/locales/en";
import es from "@/i18n/locales/es";
import fr from "@/i18n/locales/fr";
import ja from "@/i18n/locales/ja";
import ko from "@/i18n/locales/ko";
import ptBR from "@/i18n/locales/pt-BR";
import zhHans from "@/i18n/locales/zh-Hans";
import type { Locale } from "@/i18n/types";
import { getSetting, setSetting } from "@/lib/db";
import { getLocales } from "expo-localization";
import i18next, { changeLanguage, init, use as registerPlugin } from "i18next";
import { initReactI18next } from "react-i18next";
import { AppState } from "react-native";

export const LANGUAGE_SETTING = "language";

export const DEVICE = "device";

export const LOCALES: Locale[] = [ptBR, en, es, fr, de, ko, ja, zhHans];

const FALLBACK = en.tag;

/* Derived so a catalog cannot drift from the list it is registered under. */
const resources = Object.fromEntries(
  LOCALES.map((locale) => [locale.tag, locale.translations]),
);

function resolveFromDevice(): string {
  for (const { languageTag, languageCode } of getLocales()) {
    const exact = LOCALES.find((locale) => locale.tag === languageTag);
    if (exact) return exact.tag;

    const claimed = LOCALES.find(
      (locale) => languageCode !== null && locale.matches.includes(languageCode),
    );
    if (claimed) return claimed.tag;
  }
  return FALLBACK;
}

export function resolveLanguage(): string {
  const stored = getSetting(LANGUAGE_SETTING);
  if (stored !== null && stored !== DEVICE) {
    const match = LOCALES.find((locale) => locale.tag === stored);
    if (match) return match.tag;
  }
  return resolveFromDevice();
}

export function getLanguagePreference(): string {
  const stored = getSetting(LANGUAGE_SETTING);
  if (stored === null) return DEVICE;
  return LOCALES.some((locale) => locale.tag === stored) ? stored : DEVICE;
}

export function weekStartOf(tag: string): 0 | 1 {
  return LOCALES.find((locale) => locale.tag === tag)?.weekStart ?? 0;
}

export function setLanguage(tag: string): void {
  setSetting(LANGUAGE_SETTING, tag);
  void changeLanguage(tag === DEVICE ? resolveFromDevice() : tag);
}

registerPlugin(initReactI18next);

void init({
  resources,
  lng: resolveLanguage(),
  fallbackLng: FALLBACK,
  supportedLngs: LOCALES.map((locale) => locale.tag),
  defaultNS: "common",
  /* React escapes what it renders, so escaping again would double it. */
  interpolation: { escapeValue: false },
});

/* For Android, where the system language changes under a running process. iOS
restarts the app instead, so there this is a no-op. */
AppState.addEventListener("change", (status) => {
  if (status !== "active") return;
  const next = resolveLanguage();
  if (next !== i18next.language) void changeLanguage(next);
});

export default i18next;
