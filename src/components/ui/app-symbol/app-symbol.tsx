import { crossPlatformSymbol } from "@/lib/utils/icons";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";
import type { Props } from "./types";

/**
 * Every symbol outside a Compose tree, on both platforms, drawn from the SF name
 * the app stores. `weight` and `animationSpec` describe an SF Symbol and have no
 * Material counterpart, so they stop here rather than being ignored downstream.
 */
export function AppSymbol({ name, weight, animationSpec, ...rest }: Props) {
  const onIOS = Platform.OS === "ios";

  return (
    <SymbolView
      {...rest}
      name={crossPlatformSymbol(name)}
      weight={onIOS ? weight : undefined}
      animationSpec={onIOS ? animationSpec : undefined}
    />
  );
}
