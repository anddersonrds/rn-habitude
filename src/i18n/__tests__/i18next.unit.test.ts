/* eslint-disable @typescript-eslint/no-require-imports --
the module initialises at import, so each case has to reload it. */
import { resetDatabase } from "@/test-utils/sqlite";
import type { Locale as DeviceLocale } from "expo-localization";
import type { AppStateStatus } from "react-native";

jest.mock("expo-localization", () => ({ getLocales: jest.fn(() => []) }));

type I18nModule = typeof import("@/i18n/i18next");
type Database = typeof import("@/lib/data/db");

type Loaded = I18nModule & {
  i18next: I18nModule["default"];
  storedLanguage: () => string | null;
  setPreferences: (preferences: DeviceLocale[]) => void;
  appStateChanges: (status: AppStateStatus) => void;
};

/* The two fields the resolution reads; the rest is device metadata. */
function device(
  languageTag: string,
  languageCode: string | null = languageTag.split("-")[0],
): DeviceLocale {
  return { languageTag, languageCode } as DeviceLocale;
}

/* Loads the module against a device and a stored preference. */
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

  const db = require("@/lib/data/db") as Database;
  if (stored !== undefined) db.setSetting("language", stored);

  /* Spied before the import, since the module subscribes while it loads. */
  const { AppState } = require("react-native") as typeof import("react-native");
  const subscribe = jest.spyOn(AppState, "addEventListener");

  const module = require("@/i18n/i18next") as I18nModule;

  return {
    ...module,
    i18next: module.default,
    storedLanguage: () => db.getSetting("language"),
    setPreferences: (next) => localization.getLocales.mockReturnValue(next),
    appStateChanges: (status) => {
      const listener = subscribe.mock.calls.find(([event]) => event === "change");
      if (!listener) throw new Error("The module subscribed to no app state.");
      listener[1](status);
    },
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
      preferences: [device("sv-SE"), device("de-DE"), device("en-US")],
    });

    expect(i18next.language).toBe("de");
  });

  it("should resolve a regional variant through the codes a locale claims", () => {
    /* A Brazilian device reports `pt`, which is not the `pt-BR` tag. */
    const { i18next } = load({ preferences: [device("pt-PT")] });

    expect(i18next.language).toBe("pt-BR");
  });

  it("should fall back to English for a language the app does not ship", () => {
    const { i18next } = load({ preferences: [device("sv-SE")] });

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

describe("the preference the picker shows", () => {
  it("should be the stored tag", () => {
    const { getLanguagePreference } = load({
      preferences: [device("en-US")],
      stored: "pt-BR",
    });

    expect(getLanguagePreference()).toBe("pt-BR");
  });

  it("should be the device on a fresh install", () => {
    const { getLanguagePreference } = load({ preferences: [device("pt-BR")] });

    expect(getLanguagePreference()).toBe("device");
  });

  it("should be the device when the stored tag matches no catalog", () => {
    const { getLanguagePreference } = load({
      preferences: [device("en-US")],
      stored: "sv-SE",
    });

    expect(getLanguagePreference()).toBe("device");
  });
});

describe("coming back to the foreground", () => {
  it("should follow the device's new language while it is the preference", () => {
    const { i18next, setPreferences, appStateChanges } = load({
      preferences: [device("en-US")],
      stored: "device",
    });

    setPreferences([device("pt-BR")]);
    appStateChanges("active");

    expect(i18next.language).toBe("pt-BR");
  });

  it("should announce nothing when the device's language is unchanged", () => {
    const { i18next, appStateChanges } = load({
      preferences: [device("pt-BR")],
      stored: "device",
    });
    const changed = jest.fn();
    i18next.on("languageChanged", changed);

    appStateChanges("active");

    expect(changed).not.toHaveBeenCalled();
    expect(i18next.language).toBe("pt-BR");
  });

  it("should keep the language a preference names, whatever the device says", () => {
    const { i18next, setPreferences, appStateChanges } = load({
      preferences: [device("en-US")],
      stored: "en",
    });

    setPreferences([device("pt-BR")]);
    appStateChanges("active");

    expect(i18next.language).toBe("en");
  });

  it("should do nothing while the app is leaving the foreground", () => {
    const { i18next, setPreferences, appStateChanges } = load({
      preferences: [device("en-US")],
      stored: "device",
    });

    setPreferences([device("pt-BR")]);
    appStateChanges("background");

    expect(i18next.language).toBe("en");
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
