import type { ReactElement } from "react";

/** What a confirmation asks, and what it runs when the answer is yes. */
export type ConfirmRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Marked as destructive, which is the whole difference on Android. */
  destructive?: boolean;
  onConfirm: () => void;
};

export type Confirmation = {
  confirm: (request: ConfirmRequest) => void;
  /** `null` on iOS, where the native control is a call rather than a view. */
  dialog: ReactElement | null;
};
