import i18next, { LOCALES, weekStartOf } from "@/i18n/i18next";
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

const CATALOGS = LOCALES.map(
  (locale) => [locale.tag, locale.translations as Record<string, Namespace>] as const,
);

/** Every catalog except the source, as `[tag, translations]`. */
const TRANSLATIONS = CATALOGS.filter(([tag]) => tag !== en.tag);

/** Counts wide enough to reach every category any shipped language selects. */
const COUNTS = [0, 1, 2, 5, 21, 100, 1_000_000];

const INTERPOLATED: Record<string, string> = {
  done: "3",
  name: "Read",
  schedule: "Every day",
};

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

function pluralCategory(key: string): string {
  return key.slice(key.lastIndexOf("_") + 1);
}

function pluralBasesIn(translations: Record<string, Namespace>): [string, string][] {
  return Object.entries(translations).flatMap(([namespace, keys]) => {
    const bases = new Set(
      Object.keys(keys)
        .map(pluralBase)
        .filter((base): base is string => base !== null),
    );
    return [...bases].map((base): [string, string] => [namespace, base]);
  });
}

/** One count per category the language selects, plus the two the app renders most. */
function countsFor(tag: string): number[] {
  const rules = new Intl.PluralRules(tag);
  const perCategory = new Map<string, number>();
  for (const count of COUNTS) {
    const category = rules.select(count);
    if (!perCategory.has(category)) perCategory.set(category, count);
  }
  return [...new Set([0, 1, 5, ...perCategory.values()])];
}

/** What i18next is expected to interpolate the value into. */
function resolved(value: string, count: number): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    name === "count" ? String(count) : INTERPOLATED[name],
  );
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

  it("should declare a form for every category any shipped language selects", () => {
    /* The source's key set is every catalog's key set, so a category missing
    here is missing everywhere. i18next does not fall through to `_other` for
    an absent form - it leaves the language and answers in English. */
    const categories = new Set(LOCALES.flatMap((locale) => categoriesOf(locale.tag)));

    for (const [namespace, base] of pluralBasesIn(SOURCE)) {
      for (const category of categories) {
        expect(`${namespace}.${base}_${category}`).toBe(
          SOURCE[namespace][`${base}_${category}`] === undefined
            ? `${namespace}.${base} has no _${category} form`
            : `${namespace}.${base}_${category}`,
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

describe("the week", () => {
  it("should start where each language starts it", () => {
    /* Declared per locale rather than read from CLDR, which the engine on the
    device does not carry. A wrong number here is invisible to the compiler. */
    expect(
      Object.fromEntries(LOCALES.map((locale) => [locale.tag, locale.weekStart])),
    ).toEqual({
      en: 0,
      "pt-BR": 0,
      ja: 0,
      ko: 0,
      es: 1,
      fr: 1,
      de: 1,
      "zh-Hans": 1,
    });
  });

  it("should start on Sunday for a language the app does not ship", () => {
    expect(weekStartOf("sv-SE")).toBe(0);
  });
});

describe.each(CATALOGS)("the %s plural forms", (tag, translations) => {
  it("should say the same thing in every form the language never selects", () => {
    /* Japanese, Korean and Chinese have `other` and nothing else, so a count
    of one lands there too, and no language selects `many` for a number of
    habits. The source's keys are the contract, so the unused forms exist
    anyway, and only identical text makes them harmless. */
    const selected = categoriesOf(tag);

    for (const [namespace, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        const base = pluralBase(key);
        if (base === null || selected.includes(pluralCategory(key))) continue;
        expect(`${namespace}.${key}: "${value}"`).toBe(
          `${namespace}.${key}: "${keys[`${base}_other`]}"`,
        );
      }
    }
  });

  it("should answer zero, one and many from its own catalog", () => {
    /* The failure this covers is silent: an absent form sends i18next to
    English, so the count reads correctly and the language is wrong. */
    const rules = new Intl.PluralRules(tag);
    /* The keys are built from the catalog rather than written, so the typed
    signature has nothing to narrow against. */
    const t = i18next.getFixedT(tag) as unknown as (
      key: string,
      options: Record<string, unknown>,
    ) => string;

    for (const [namespace, base] of pluralBasesIn(translations)) {
      for (const count of countsFor(tag)) {
        const form = translations[namespace][`${base}_${rules.select(count)}`];
        expect(
          `${namespace}.${base}(${count}): "${t(`${namespace}:${base}`, { count, ...INTERPOLATED })}"`,
        ).toBe(
          `${namespace}.${base}(${count}): "${form === undefined ? `no _${rules.select(count)} form` : resolved(form, count)}"`,
        );
      }
    }
  });
});
