import { DatabaseSync } from "node:sqlite";

/**
 * `jest-expo` auto-mocks every Expo native module, and its `ExpoSQLite` stub is a
 * set of functions returning `undefined`. This codebase does real work at import
 * time - `db.ts` opens the database and creates the schema, `store.ts` loads
 * state - so with the stub those modules throw before a test runs and most of
 * the app is unreachable.
 *
 * The fix is a real in-memory database rather than a fake. `db.ts` and `store.ts`
 * then run the SQL that ships: real primary key conflicts, real `INSERT OR
 * IGNORE`, real `ON CONFLICT DO UPDATE`, real rollback.
 *
 * The runner has to be Node 24 for `node:sqlite` to exist. Bun stays the package
 * manager and the script runner; `bun run` launches Jest's bin through its
 * `#!/usr/bin/env node` shebang, so Node is what executes the suite.
 */

type BindValue = string | number | bigint | null | Uint8Array;

/** The five methods the app calls, and the only five this translates. */
export type TestDatabase = {
  execSync(source: string): void;
  runSync(
    source: string,
    params?: BindValue[],
  ): { changes: number; lastInsertRowId: number };
  getAllSync<T>(source: string, params?: BindValue[]): T[];
  getFirstSync<T>(source: string, params?: BindValue[]): T | null;
  withTransactionSync(task: () => void): void;
};

// The database lives on the global scope rather than in module state because
// tests reset the module registry between cases and re-import the store. Module
// state would be discarded with it, taking the seeded rows along.
const DATABASE: unique symbol = Symbol.for("habitude.test-database");

type Holder = { current: DatabaseSync };

function holder(): Holder {
  const scope = globalThis as { [DATABASE]?: Holder };
  return (scope[DATABASE] ??= { current: new DatabaseSync(":memory:") });
}

/**
 * Discards the database and opens an empty one. The schema goes with it, so a
 * caller resets the module registry afterwards and lets `db.ts` recreate it.
 */
export function resetDatabase(): void {
  const held = holder();
  held.current.close();
  held.current = new DatabaseSync(":memory:");
}

/**
 * A stable handle: it reads the current database on every call, so a reset
 * cannot strand a module that captured it at import time.
 */
export function getTestDatabase(): TestDatabase {
  return {
    execSync(source) {
      holder().current.exec(source);
    },
    runSync(source, params = []) {
      const result = holder().current.prepare(source).run(...params);
      return {
        changes: Number(result.changes),
        // `node:sqlite` spells the second word differently from `expo-sqlite`.
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getAllSync(source, params = []) {
      return holder().current.prepare(source).all(...params) as never;
    },
    getFirstSync(source, params = []) {
      // `StatementSync.get` answers `undefined`; the contract everywhere in
      // `db.ts` and `store.ts` is `null`.
      return (holder().current.prepare(source).get(...params) ?? null) as never;
    },
    withTransactionSync(task) {
      const database = holder().current;
      database.exec("BEGIN");
      try {
        task();
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

/** The `expo-sqlite` surface the app imports, backed by the in-memory database. */
export function expoSqliteMock(): { openDatabaseSync: () => TestDatabase } {
  return { openDatabaseSync: getTestDatabase };
}
