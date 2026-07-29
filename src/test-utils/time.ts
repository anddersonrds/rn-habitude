/**
 * Every source of non-determinism the app reads, controlled from one place so a
 * new test cannot forget one of them:
 *
 * - `store.ts` builds ids from `Date.now()` and `Math.random()`.
 * - Completions record `new Date().toISOString()`.
 * - `dates.ts` formats with `undefined` as the locale, which resolves to the
 *   machine's.
 *
 * Without this the suite's result changes with the day, the locale, and the
 * timezone of the machine running it.
 */

/** Fixed so the two formatters can be asserted against a known output. */
export const TEST_LOCALE = "en-US";

/**
 * Deliberately not UTC. Every date key in the app is local midnight, and a
 * suite pinned to UTC cannot tell local-midnight code from UTC-midnight code.
 */
export const TEST_TIME_ZONE = "America/Sao_Paulo";

/**
 * Both are asserted rather than assigned. `dates.ts` passes `undefined` as the
 * locale, which resolves through the intrinsic formatter, and neither that nor
 * the timezone can be redirected once the process is running - they come from
 * the environment the runner was launched with, which is why the test scripts
 * set them. Checking here is what turns a bare `jest` run into a clear failure
 * instead of assertions that pass or fail depending on the machine.
 */
export function assertStableEnvironment(): void {
  const { locale, timeZone } = Intl.DateTimeFormat().resolvedOptions();
  if (locale !== TEST_LOCALE || timeZone !== TEST_TIME_ZONE) {
    throw new Error(
      `The suite needs the locale pinned to ${TEST_LOCALE} and the timezone to ` +
        `${TEST_TIME_ZONE}, but this process has ${locale} and ${timeZone}. ` +
        `Run it through the project's test script rather than calling jest directly.`,
    );
  }
}

// Freezing the clock must not also stop timers: most tests want a fixed date
// and real scheduling, and the few that drive timers ask for them explicitly.
const TIMERS_STAY_REAL = [
  "hrtime",
  "nextTick",
  "performance",
  "queueMicrotask",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "cancelIdleCallback",
  "setImmediate",
  "clearImmediate",
  "setInterval",
  "clearInterval",
  "setTimeout",
  "clearTimeout",
] as const;

/**
 * Freezes the clock at an instant. Timers keep running, so this is safe to
 * combine with anything that awaits.
 */
export function freezeClock(instant: string): void {
  jest.useFakeTimers({
    now: new Date(instant),
    doNotFake: [...TIMERS_STAY_REAL],
  });
}

/** Hands the clock back. */
export function restoreClock(): void {
  jest.useRealTimers();
}

/**
 * Makes `newId()` reproducible. The sequence has to keep moving: a constant
 * would give two habits created in one test the same id, and the insert would
 * fail on the primary key rather than on anything the test meant to assert.
 */
export function stableIds(): void {
  let step = 0;
  jest.spyOn(Math, "random").mockImplementation(() => {
    step += 1;
    // An additive recurrence on the golden ratio: deterministic, and it moves
    // the leading digits on every call, which is the part an id is built from.
    return (step * 0.6180339887498949) % 1;
  });
}
