/**
 * The clock, the locale and `Math.random`, controlled from one place so a new
 * test cannot forget one of them.
 */

export const TEST_LOCALE = "en-US";

/** Not UTC: every date key in the app is local midnight, and UTC would hide it. */
export const TEST_TIME_ZONE = "America/Sao_Paulo";

/**
 * Asserted rather than assigned. Node fixes both from the environment it was
 * launched with, and `dates.ts` formats through the intrinsic formatter, so
 * neither can be redirected once the process is running. The test scripts set
 * them; this turns a bare `jest` call into a clear failure.
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

/* Freezing the clock must not stop timers: the tests that drive them say so. */
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

export function freezeClock(instant: string): void {
  jest.useFakeTimers({
    now: new Date(instant),
    doNotFake: [...TIMERS_STAY_REAL],
  });
}

export function restoreClock(): void {
  jest.useRealTimers();
}

/**
 * Makes `newId()` reproducible. The sequence keeps moving because a constant
 * would give two habits in one test the same id, failing on the primary key
 * instead of on what the test meant to assert.
 */
export function stableIds(): void {
  let step = 0;
  jest.spyOn(Math, "random").mockImplementation(() => {
    step += 1;
    /* Additive recurrence on the golden ratio: moves the leading digits, which
     * is the part an id is built from. */
    return (step * 0.6180339887498949) % 1;
  });
}
