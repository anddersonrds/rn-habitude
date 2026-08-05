import type en from "@/i18n/locales/en";

/**
 * What a locale file declares before its catalog is pinned to a key set. `en`
 * is checked against this one, since it is the file every other locale is
 * derived from and so has nothing stricter to be checked against.
 */
export type SourceLocale = {
  tag: string;
  label: string;
  /* The device language codes this locale claims, e.g. `pt` for `pt-BR`. */
  matches: string[];
  translations: Record<string, Record<string, string>>;
};

/** The key set every catalog carries, so a missing key is a `tsc` error. */
export type Translations = typeof en.translations;

/**
 * A language, whole: its tag, the name shown in the picker, the device codes it
 * claims, and its copy. Nothing about a language lives outside its own file.
 */
export type Locale = Omit<SourceLocale, "translations"> & {
  translations: Translations;
};
