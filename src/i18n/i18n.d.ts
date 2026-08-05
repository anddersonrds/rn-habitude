import type { Translations } from "@/i18n/types";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: Translations;
  }
}
