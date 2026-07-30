import { DatabaseSync } from "node:sqlite";

/**
 * Replaces `expo-sqlite` with a real in-memory database, so `db.ts` and
 * `store.ts` run the SQL that ships. The runner's own stub returns `undefined`
 * from everything, which makes both modules throw at import.
 *
 * Requires Node 24. Bun stays the package manager and script runner; it
 * launches the test runner's bin through its node shebang.
 */

type BindValue = string | number | bigint | null | Uint8Array;

/** The five methods the app calls, and the only five translated here. */
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

/* Held on the global scope, not in module state: tests reset the module
 * registry between cases, which would discard the seeded rows with it. */
const DATABASE: unique symbol = Symbol.for("habitude.test-database");

type Holder = { current: DatabaseSync };

function holder(): Holder {
  const scope = globalThis as { [DATABASE]?: Holder };
  return (scope[DATABASE] ??= { current: new DatabaseSync(":memory:") });
}

/**
 * Opens an empty database. The schema goes with the old one, so reset the
 * module registry afterwards and let `db.ts` recreate it.
 */
export function resetDatabase(): void {
  const held = holder();
  held.current.close();
  held.current = new DatabaseSync(":memory:");
}

/** Reads the current database on every call, so a reset cannot strand it. */
export function getTestDatabase(): TestDatabase {
  return {
    execSync(source) {
      holder().current.exec(source);
    },
    runSync(source, params = []) {
      const result = holder().current.prepare(source).run(...params);
      return {
        changes: Number(result.changes),
        /* `node:sqlite` spells this `lastInsertRowid`. */
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getAllSync(source, params = []) {
      return holder().current.prepare(source).all(...params) as never;
    },
    getFirstSync(source, params = []) {
      /* `StatementSync.get` answers `undefined`; the contract is `null`. */
      return (holder().current.prepare(source).get(...params) ?? null) as never;
    },
    withTransactionSync(task) {
      const database = holder().current;
      database.exec("BEGIN");
      try {
        task();
        database.exec("COMMIT");
      } catch (error) {
        /* `deleteHabit` and `reorderHabits` need the transaction atomic. */
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export function expoSqliteMock(): { openDatabaseSync: () => TestDatabase } {
  return { openDatabaseSync: getTestDatabase };
}
