import type { Href } from "expo-router";

/**
 * Every destination the app can navigate to, as a function of what it needs.
 *
 * Typed routes are on, but the generated `Href` accepts any query string after
 * a known path, so a raw `` `/habit-form?id=${id}` `` typechecks while carrying
 * a parameter name nothing checks. Going through this module is what makes the
 * parameter checked, and what makes a renamed route one edit rather than nine.
 */
export const routes = {
  /** The tab the app returns to when there is nothing to go back to. */
  home: (): Href => "/",
  habitForm: (id?: string): Href => (id ? `/habit-form?id=${id}` : "/habit-form"),
  habitDetail: (id: string): Href => `/habit/${id}`,
  habitHistory: (id: string): Href => `/habit-history?id=${id}`,
} as const;
