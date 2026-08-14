import type { Confirm } from "@/lib/utils/confirmations";
import type { ReactElement } from "react";

export type Confirmation = {
  confirm: Confirm;
  /** `null` on iOS, where the native control is a call rather than a view. */
  dialog: ReactElement | null;
};
