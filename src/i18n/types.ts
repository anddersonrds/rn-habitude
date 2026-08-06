import type en from "@/i18n/locales/en";

/** The shape `en` is checked against, before a catalog is pinned to its keys. */
export type SourceLocale = {
  tag: string;
  label: string;
  /* The device language codes this locale claims, e.g. `pt` for `pt-BR`. */
  matches: string[];
  /* The day a week starts on, 0 for Sunday. Declared rather than read from
  CLDR because the engine on the device carries no `Intl.Locale`. */
  weekStart: 0 | 1;
  translations: Record<string, Record<string, string>>;
};

export type Translations = typeof en.translations;

export type Locale = Omit<SourceLocale, "translations"> & {
  translations: Translations;
};
