import type { Translations } from "@/i18n/types";

/**
 * Types every key against the source catalog, in both directions: `t("nope")`
 * and a catalog missing a key both fail `tsc`. `common` is the default
 * namespace, so a shared word is `t("cancel")` and everything else is explicit.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: Translations;
  }
}
