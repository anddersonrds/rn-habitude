/* eslint-disable @typescript-eslint/no-require-imports --
the module runs its schema at import, so each case has to reload it rather than
close over one instance.
*/
import { resetDatabase } from "@/test-utils/sqlite";

type DbModule = typeof import("@/lib/data/db");

/** An empty database with the schema freshly applied by the module itself. */
function freshDb(): DbModule {
  resetDatabase();
  jest.resetModules();
  return require("@/lib/data/db");
}

function tableNames(db: DbModule): string[] {
  return db.db
    .getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .map((row) => row.name);
}

describe("ensureSchema", () => {
  it("should create the habits, completions and settings tables at import", () => {
    expect(tableNames(freshDb())).toEqual([
      "completions",
      "habits",
      "settings",
    ]);
  });

  it("should be safe to run again on a database that already has the schema", () => {
    const db = freshDb();
    db.setSetting("onboarded", "1");

    db.ensureSchema();

    expect(tableNames(db)).toEqual(["completions", "habits", "settings"]);
    expect(db.getSetting("onboarded")).toBe("1");
  });
});

describe("getSetting", () => {
  it("should return null for a key that was never written", () => {
    expect(freshDb().getSetting("onboarded")).toBeNull();
  });

  it("should return the stored value for a key that was written", () => {
    const db = freshDb();
    db.setSetting("onboarded", "1");
    expect(db.getSetting("onboarded")).toBe("1");
  });
});

describe("setSetting", () => {
  it("should insert a key that does not exist yet", () => {
    const db = freshDb();
    db.setSetting("onboarded", "1");
    expect(db.getSetting("onboarded")).toBe("1");
  });

  it("should overwrite a key that already exists rather than failing on it", () => {
    const db = freshDb();
    db.setSetting("onboarded", "1");
    db.setSetting("onboarded", "0");
    expect(db.getSetting("onboarded")).toBe("0");
  });

  it("should keep other keys untouched when one is overwritten", () => {
    const db = freshDb();
    db.setSetting("onboarded", "1");
    db.setSetting("theme", "dark");
    db.setSetting("onboarded", "0");
    expect([db.getSetting("onboarded"), db.getSetting("theme")]).toEqual([
      "0",
      "dark",
    ]);
  });
});
