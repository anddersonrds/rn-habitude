import { LOCALES } from "@/i18n/i18next";
import en from "@/i18n/locales/en";

/**
 * What TypeScript already refuses is not repeated here. `CustomTypeOptions`
 * pins every catalog to `en`'s keys, so a missing or invented key is a build
 * failure. These cases cover what a type cannot see: an empty value, a plural
 * form that is absent for a language that needs it, and a placeholder that was
 * dropped in translation. The key-set case stays anyway, because it is the one
 * assertion that survives someone reaching for a cast.
 */

type Namespace = Record<string, string>;

const SOURCE = en.translations as Record<string, Namespace>;

/** Every catalog except the source, as `[tag, translations]`. */
const TRANSLATIONS = LOCALES.filter((locale) => locale.tag !== en.tag).map(
  (locale) => [locale.tag, locale.translations as Record<string, Namespace>] as const,
);

/** `{{name}}` and `{{count}}` and anything else a value interpolates. */
function placeholdersIn(value: string): string[] {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
}

/** Every `namespace.key` pair in a catalog, sorted so two can be compared. */
function pathsIn(translations: Record<string, Namespace>): string[] {
  return Object.entries(translations)
    .flatMap(([namespace, keys]) =>
      Object.keys(keys).map((key) => `${namespace}.${key}`),
    )
    .sort();
}

/** The plural categories a language selects between, e.g. `["other"]`. */
function categoriesOf(tag: string): string[] {
  return new Intl.PluralRules(tag).resolvedOptions().pluralCategories;
}

/** The base of a plural key, or null when the key is not a plural form. */
function pluralBase(key: string): string | null {
  const match = /^(.*)_(zero|one|two|few|many|other)$/.exec(key);
  return match ? match[1] : null;
}

describe("the source catalog", () => {
  it("should carry no key that resolves to nothing", () => {
    for (const [namespace, keys] of Object.entries(SOURCE)) {
      for (const [key, value] of Object.entries(keys)) {
        expect(`${namespace}.${key}: "${value}"`).toBe(
          `${namespace}.${key}: "${value.trim()}"`,
        );
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("should give every plural key an `_other` form", () => {
    /* `_other` is the only category every language has. A plural key without
    it falls through to the key itself in Japanese, Korean and Chinese. */
    for (const [namespace, keys] of Object.entries(SOURCE)) {
      const bases = new Set(
        Object.keys(keys)
          .map(pluralBase)
          .filter((base): base is string => base !== null),
      );
      for (const base of bases) {
        expect(`${namespace}.${base}_other`).toBe(
          keys[`${base}_other`] === undefined
            ? `${namespace}.${base} has no _other form`
            : `${namespace}.${base}_other`,
        );
      }
    }
  });
});

describe.each(TRANSLATIONS)("the %s catalog", (_tag, translations) => {
  it("should carry exactly the keys the source carries", () => {
    expect(pathsIn(translations)).toEqual(pathsIn(SOURCE));
  });

  it("should carry no key that resolves to nothing", () => {
    for (const [namespace, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        expect(`${namespace}.${key}: "${value}"`).toBe(
          `${namespace}.${key}: "${value.trim()}"`,
        );
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("should interpolate the same placeholders the source does", () => {
    for (const [namespace, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        expect(`${namespace}.${key}: ${placeholdersIn(value).join()}`).toBe(
          `${namespace}.${key}: ${placeholdersIn(SOURCE[namespace][key]).join()}`,
        );
      }
    }
  });

  it("should say the same thing in every plural form the language never selects", () => {
    /* Japanese, Korean and Chinese have `other` and nothing else, so a count
    of one lands there too. The source's keys are the contract, so the unused
    forms exist anyway, and only identical text makes them harmless. */
    if (categoriesOf(_tag).length > 1) return;

    for (const [namespace, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        const base = pluralBase(key);
        if (base === null) continue;
        expect(`${namespace}.${key}: "${value}"`).toBe(
          `${namespace}.${key}: "${keys[`${base}_other`]}"`,
        );
      }
    }
  });

  it("should leave the product name alone", () => {
    /* `habitude` is the product name in every language, including inside a
    translated sentence. */
    for (const [namespace, keys] of Object.entries(SOURCE)) {
      for (const [key, value] of Object.entries(keys)) {
        if (!value.includes("habitude")) continue;
        expect(`${namespace}.${key}`).toBe(
          translations[namespace][key].includes("habitude")
            ? `${namespace}.${key}`
            : `${namespace}.${key} lost the product name`,
        );
      }
    }
  });
});
