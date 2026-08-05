/* eslint-disable @typescript-eslint/no-require-imports --
the module resolves the language and initialises i18next at import, so each case
has to reload it rather than close over one instance.
*/
import { resetDatabase } from "@/test-utils/sqlite";
import type { Locale as DeviceLocale } from "expo-localization";

/*
Mocked at the package boundary: the device's preferences are the one input the
resolution has that the runner cannot produce.
*/
jest.mock("expo-localization", () => ({ getLocales: jest.fn(() => []) }));

type I18nModule = typeof import("@/i18n/i18next");
type Database = typeof import("@/lib/db");

type Loaded = I18nModule & {
  /** The instance the module initialised, out of the same registry. */
  i18next: I18nModule["default"];
  /** Read through the same registry the module under test wrote through. */
  storedLanguage: () => string | null;
};

/** The two fields the resolution reads; the rest is device metadata. */
function device(
  languageTag: string,
  languageCode: string | null = languageTag.split("-")[0],
): DeviceLocale {
  return { languageTag, languageCode } as DeviceLocale;
}

/**
 * Loads the module against a device and a stored preference. The database is
 * rebuilt first, so `db.ts` recreates the schema as it is required again.
 */
function load({
  preferences = [],
  stored,
}: {
  preferences?: DeviceLocale[];
  stored?: string;
} = {}): Loaded {
  resetDatabase();
  jest.resetModules();

  const localization = require("expo-localization") as { getLocales: jest.Mock };
  localization.getLocales.mockReturnValue(preferences);

  const db = require("@/lib/db") as Database;
  if (stored !== undefined) db.setSetting("language", stored);

  const module = require("@/i18n/i18next") as I18nModule;

  return {
    ...module,
    i18next: module.default,
    storedLanguage: () => db.getSetting("language"),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("the language resolution", () => {
  it("should open in the device's language", () => {
    const { i18next } = load({ preferences: [device("pt-BR")] });

    expect(i18next.language).toBe("pt-BR");
  });

  it("should take the first supported language in the device's own order", () => {
    const { i18next } = load({
      preferences: [device("de-DE"), device("pt-PT"), device("en-US")],
    });

    expect(i18next.language).toBe("pt-BR");
  });

  it("should resolve a regional variant through the codes a locale claims", () => {
    /* A Brazilian device reports `pt`, which is not the `pt-BR` tag. */
    const { i18next } = load({ preferences: [device("pt-PT")] });

    expect(i18next.language).toBe("pt-BR");
  });

  it("should fall back to English for a language the app does not ship", () => {
    const { i18next } = load({ preferences: [device("de-DE")] });

    expect(i18next.language).toBe("en");
  });

  it("should fall back to English when the device reports no preference", () => {
    const { i18next } = load({ preferences: [] });

    expect(i18next.language).toBe("en");
  });

  it("should ignore a device locale that reports no language code", () => {
    const { i18next } = load({
      preferences: [device("und", null), device("pt-BR")],
    });

    expect(i18next.language).toBe("pt-BR");
  });
});

describe("the stored preference", () => {
  it("should beat the device", () => {
    const { i18next } = load({ preferences: [device("pt-BR")], stored: "en" });

    expect(i18next.language).toBe("en");
  });

  it("should fall through to the device while it says to follow it", () => {
    const { i18next } = load({
      preferences: [device("pt-BR")],
      stored: "device",
    });

    expect(i18next.language).toBe("pt-BR");
  });

  it("should be ignored when no catalog matches it", () => {
    const { i18next } = load({
      preferences: [device("pt-BR")],
      stored: "sv-SE",
    });

    expect(i18next.language).toBe("pt-BR");
  });
});

describe("changing the language", () => {
  it("should store the tag and switch to it", () => {
    const { setLanguage, i18next, storedLanguage } = load({
      preferences: [device("en-US")],
    });

    setLanguage("pt-BR");

    expect(storedLanguage()).toBe("pt-BR");
    expect(i18next.language).toBe("pt-BR");
  });

  it("should re-resolve from the device when told to follow it", () => {
    const { setLanguage, i18next, storedLanguage } = load({
      preferences: [device("pt-BR")],
      stored: "en",
    });

    setLanguage("device");

    expect(storedLanguage()).toBe("device");
    expect(i18next.language).toBe("pt-BR");
  });
});

describe("the catalogs", () => {
  it("should load one for every locale in the list, and no other", () => {
    const { LOCALES, i18next } = load();

    expect(Object.keys(i18next.options.resources ?? {})).toEqual(
      LOCALES.map((locale) => locale.tag),
    );
    expect(i18next.options.supportedLngs).toEqual(
      expect.arrayContaining(LOCALES.map((locale) => locale.tag)),
    );
  });

  it("should translate through the default namespace without naming it", () => {
    const { i18next } = load({ preferences: [device("pt-BR")] });

    expect(i18next.t("cancel")).toBe("Cancelar");
    expect(i18next.t("settings:about")).toBe("Sobre");
  });
});
