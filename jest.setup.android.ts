/* eslint-disable @typescript-eslint/no-require-imports --
mock factories are hoisted above imports and cannot close over them.
*/
import type { SymbolViewProps } from "expo-symbols";

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
