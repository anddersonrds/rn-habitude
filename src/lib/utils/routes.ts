import type { Href } from "expo-router";

/* Typed routes accept any query string after a known path, so a raw
`` `/habit-form?id=${id}` `` typechecks with a parameter name nothing checks.
Going through here is what checks the parameter. */
export const routes = {
  home: (): Href => "/",
  habitForm: (id?: string): Href => (id ? `/habit-form?id=${id}` : "/habit-form"),
  habitDetail: (id: string): Href => `/habit/${id}`,
  habitHistory: (id: string): Href => `/habit-history?id=${id}`,
} as const;
