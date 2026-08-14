import type { ConfirmRequest } from "@/lib/utils/confirmations";
import { useCallback } from "react";
import { Alert } from "react-native";
import type { Confirmation } from "./types";

export function useConfirm(): Confirmation {
  const confirm = useCallback((request: ConfirmRequest) => {
    const answer = {
      text: request.confirmLabel,
      style: request.destructive ? ("destructive" as const) : ("default" as const),
      onPress: request.onConfirm,
    };

    Alert.alert(
      request.title,
      request.body,
      request.cancelLabel
        ? [{ text: request.cancelLabel, style: "cancel" }, answer]
        : [answer],
    );
  }, []);

  return { confirm, dialog: null };
}
