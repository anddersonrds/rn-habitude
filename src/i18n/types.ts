import type en from "@/i18n/locales/en";

/** The shape `en` is checked against, before a catalog is pinned to its keys. */
export type SourceLocale = {
  tag: string;
  label: string;
  /* The device language codes this locale claims, e.g. `pt` for `pt-BR`. */
  matches: string[];
  translations: Record<string, Record<string, string>>;
};

export type Translations = typeof en.translations;

export type Locale = Omit<SourceLocale, "translations"> & {
  translations: Translations;
};
