import { crossPlatformSymbol } from "@/lib/utils/icons";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";
import type { Props } from "./types";

/**
 * A symbol, drawn from the SF Symbol name the app stores, on both platforms.
 *
 * Every symbol outside a Compose tree comes through here, so the translation to
 * Material happens in one place. `weight` and `animationSpec` describe an SF
 * Symbol and have no Material counterpart, so they stop at the boundary rather
 * than being passed on to be ignored.
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
