import { LOCALES } from "@/i18n/i18next";

/**
 * Nothing here goes from red to green. The runner is Node with full ICU, so it
 * already selects correctly and the defect is the device's alone. These cases
 * guard the polyfill, which is what would go missing without a word.
 */

const installed = (Intl.PluralRules as { polyfilled?: boolean }).polyfilled;

function categoriesOf(tag: string): string[] {
  return [...new Intl.PluralRules(tag).resolvedOptions().pluralCategories].sort();
}

describe("the plural rules", () => {
  it("should be the polyfill rather than whatever the engine ships", () => {
    expect(installed).toBe(true);
  });

  it("should resolve a regional tag through its language's data", () => {
    /* A tag that finds no data falls back to the default locale in silence. */
    expect(new Intl.PluralRules("pt-BR").resolvedOptions().locale).toBe("pt");
    expect(new Intl.PluralRules("zh-Hans").resolvedOptions().locale).toBe("zh");
  });

  it("should select between the categories each shipped language has", () => {
    expect(
      Object.fromEntries(LOCALES.map((locale) => [locale.tag, categoriesOf(locale.tag)])),
    ).toEqual({
      en: ["one", "other"],
      de: ["one", "other"],
      "pt-BR": ["many", "one", "other"],
      es: ["many", "one", "other"],
      fr: ["many", "one", "other"],
      ja: ["other"],
      ko: ["other"],
      "zh-Hans": ["other"],
    });
  });
});
