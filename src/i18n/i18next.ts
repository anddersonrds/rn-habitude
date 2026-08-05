import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-BR";
import type { Locale } from "@/i18n/types";
import { getSetting, setSetting } from "@/lib/db";
import { getLocales } from "expo-localization";
/* The named exports are bound to the default instance, which is the one
`react-i18next` reads, so both halves of this import drive the same object. */
import i18next, { changeLanguage, init, use as registerPlugin } from "i18next";
import { initReactI18next } from "react-i18next";
import { AppState } from "react-native";

/** The key the preference is stored under, beside the rest of the settings. */
export const LANGUAGE_SETTING = "language";

/** Stored in place of a tag while the app follows the device. */
export const DEVICE = "device";

/**
 * Every language the app ships. A locale carries its own tag, label and device
 * codes, so adding one is a new file plus an entry here.
 */
export const LOCALES: Locale[] = [ptBR, en];

const FALLBACK = en.tag;

/* Derived rather than declared beside the list: a catalog outside it cannot be
loaded, and an entry without a catalog does not compile. */
const resources = Object.fromEntries(
  LOCALES.map((locale) => [locale.tag, locale.translations]),
);

/**
 * The device's preferences, in the device's own order. An exact tag wins over
 * a claimed language code, so a future `zh-Hant` can claim its own tag without
 * taking `zh` from `zh-Hans`.
 */
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

/**
 * The language the app opens in. Every step is synchronous, which is what keeps
 * a flash of English off the first frame: there is no state to load into.
 */
export function resolveLanguage(): string {
  const stored = getSetting(LANGUAGE_SETTING);
  /* A tag no catalog matches - a removed locale, a corrupt write - is ignored. */
  if (stored !== null && stored !== DEVICE) {
    const match = LOCALES.find((locale) => locale.tag === stored);
    if (match) return match.tag;
  }
  return resolveFromDevice();
}

/**
 * What the picker shows as selected: a tag, or `DEVICE` while the app follows
 * the phone. A stored value no catalog matches reads as `DEVICE`, which is the
 * language the app is actually running in that case.
 */
export function getLanguagePreference(): string {
  const stored = getSetting(LANGUAGE_SETTING);
  if (stored === null) return DEVICE;
  return LOCALES.some((locale) => locale.tag === stored) ? stored : DEVICE;
}

/** Persists the preference and applies it. `DEVICE` re-reads the device. */
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

/*
This exists for Android, where the system language can change under a running
process. iOS restarts the app instead, so there it is almost always a no-op and
would read as dead code otherwise.

It re-runs the whole resolution rather than only the device half, so a
foreground can never disagree with a launch: with a language stored, that
language is what comes back and nothing changes.
*/
AppState.addEventListener("change", (status) => {
  if (status !== "active") return;
  const next = resolveLanguage();
  if (next !== i18next.language) void changeLanguage(next);
});

export default i18next;
