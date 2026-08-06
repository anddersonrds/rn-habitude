import { LOCALES } from "@/i18n/i18next";

/**
 * Nothing here can go from red to green. The runner is Node, which has full
 * ICU, so it already selects plural forms correctly; the defect these cases
 * exist for lives in Hermes, and the fix is verified on a device. What they do
 * lock down is the polyfill: that the app installs it, and that every shipped
 * tag finds real data. Both would go silently missing if an import at the top
 * of `i18next.ts` were dropped, and no other case in the suite would notice.
 */

/* The flag the polyfill sets on the constructor it puts on `Intl`. */
const installed = (Intl.PluralRules as { polyfilled?: boolean }).polyfilled;

/** The categories a language selects between, in a stable order. */
function categoriesOf(tag: string): string[] {
  return [...new Intl.PluralRules(tag).resolvedOptions().pluralCategories].sort();
}

describe("the plural rules", () => {
  it("should be the polyfill rather than whatever the engine ships", () => {
    expect(installed).toBe(true);
  });

  it("should resolve a regional tag through its language's data", () => {
    /* No `pt-BR` or `zh-Hans` data is published. A tag that finds none falls
    back to the default locale without complaining, which would quietly hand
    Portuguese the English rules. */
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
