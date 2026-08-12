/* eslint-disable @typescript-eslint/no-require-imports --
mock factories are hoisted above imports and cannot close over them.
*/
import type { MaterialColorsOptions } from "@expo/ui/jetpack-compose";
import type { SymbolViewProps } from "expo-symbols";

/*
A Material 3 palette is generated natively, and the runner has no native side,
so `getMaterialColors` answers with a colour derived from the role and the
appearance asked for: valid, distinct and stable, which is all a screen reading
`colors` needs. A case about a particular role stands its own value in.
*/
jest.mock("@expo/ui/jetpack-compose", () => {
  function roleColor(role: string, scheme: string): string {
    const seed = `${role}/${scheme}`;
    let hash = 0;
    for (const character of seed) {
      hash = (hash * 31 + character.charCodeAt(0)) % 0xffffff;
    }
    return `#${hash.toString(16).padStart(6, "0")}FF`;
  }

  return {
    ...jest.requireActual<typeof import("@expo/ui/jetpack-compose")>(
      "@expo/ui/jetpack-compose",
    ),
    getMaterialColors: ({ scheme = "light" }: MaterialColorsOptions = {}) =>
      new Proxy({}, { get: (_target, role: string) => roleColor(role, scheme) }),
  };
});

/*
`expo-symbols` ships no native view for Android. Its default implementation
draws a Material icon font, and a glyph is a codepoint rather than a name, so a
symbol drawn on Android leaves nothing a test can ask about - and a symbol asked
for by an iOS name draws nothing at all. The runner therefore renders the same
view-manager stand-in iOS renders, carrying the name the app asked for, so one
shared suite asserts the same symbol on both platforms. What Android draws from
that name is `lib/utils/icons.ts`'s contract and is asserted there.
*/
jest.mock("expo-symbols", () => {
  const React = require("react") as typeof import("react");
  const { requireNativeViewManager } =
    require("expo-modules-core") as typeof import("expo-modules-core");
  const NativeView = requireNativeViewManager("SymbolModule");

  function SymbolView({ name, ...rest }: SymbolViewProps) {
    return React.createElement(NativeView, {
      ...rest,
      name: typeof name === "object" ? name.ios : name,
    });
  }

  return {
    ...jest.requireActual<typeof import("expo-symbols")>("expo-symbols"),
    SymbolView,
  };
});
