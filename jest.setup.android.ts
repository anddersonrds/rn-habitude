/* eslint-disable @typescript-eslint/no-require-imports --
mock factories are hoisted above imports and cannot close over them.
*/
import type { MaterialColorsOptions } from "@expo/ui/jetpack-compose";
import type { SymbolViewProps } from "expo-symbols";

/*
A Material 3 palette is generated natively. The stand-in derives a colour from
the role and the appearance asked for, so the values are valid, distinct and
stable, which is all a screen reading `colors` needs.

It stands in at the native module rather than at `@expo/ui/jetpack-compose`,
because `<Host>` seeds its palette by calling `getMaterialColors` inside that
module: an export replaced from outside leaves that call reaching the real
native one, and a Host renders no further than the `TypeError` it throws.
*/
jest.mock("expo", () => {
  const actual = jest.requireActual<typeof import("expo")>("expo");

  function roleColor(role: string, scheme: string): string {
    const seed = `${role}/${scheme}`;
    let hash = 0;
    for (const character of seed) {
      hash = (hash * 31 + character.charCodeAt(0)) % 0xffffff;
    }
    return `#${hash.toString(16).padStart(6, "0")}FF`;
  }

  return {
    ...actual,
    requireNativeModule: (name: string) => {
      const module = actual.requireNativeModule(name);
      if (name !== "ExpoUI") return module;

      return {
        ...module,
        getMaterialColors: ({ scheme = "light" }: MaterialColorsOptions = {}) =>
          new Proxy({}, { get: (_target, role: string) => roleColor(role, scheme) }),
      };
    },
  };
});

/*
`expo-symbols` ships no native view for Android: it draws an icon font, and a
glyph is a codepoint, so a symbol leaves nothing in the tree to ask about. The
stand-in renders the view manager iOS renders, carrying the name the app asked
for, so one shared suite asserts the same symbol on both platforms. The
translation that name gets on Android is asserted in `lib/utils/icons.ts`.
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
