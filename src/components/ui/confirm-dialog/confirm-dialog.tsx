import { useCallback } from "react";
import { Alert } from "react-native";
import type { Confirmation, ConfirmRequest } from "./types";

/**
 * The native control here is `Alert.alert`, which is a call and not a view, so
 * this half of the pair returns nothing to render and the two platforms still
 * read the same at a call site.
 */
export function useConfirm(): Confirmation {
  const confirm = useCallback((request: ConfirmRequest) => {
    Alert.alert(request.title, request.body, [
      { text: request.cancelLabel, style: "cancel" },
      {
        text: request.confirmLabel,
        style: request.destructive ? "destructive" : "default",
        onPress: request.onConfirm,
      },
    ]);
  }, []);

  return { confirm, dialog: null };
}
