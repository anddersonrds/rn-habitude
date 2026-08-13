/* eslint-disable @typescript-eslint/no-require-imports --
mock factories are hoisted above imports and cannot close over them.
*/
import type { MaterialColorsOptions } from "@expo/ui/jetpack-compose";
import type { SymbolViewProps } from "expo-symbols";
import { NativeModules } from "react-native";

/*
The widget's native module is not linked under the runner, and the package
answers any property on it by throwing, so one store mutation would take down
every suite that reaches the store. Standing in the module rather than the
package keeps the code above it - the update request, the tree it builds - the
code that ships. No widget is on a home screen here, so it reports none.
*/
NativeModules.AndroidWidget = {
  getWidgetInfo: async () => [],
  drawWidgetById: () => {},
};

/*
A Material 3 palette is generated natively, and the stand-in derives a colour
from the role and the appearance asked for. It replaces the native module rather
than the `@expo/ui/jetpack-compose` export, because `<Host>` seeds its palette
with a call inside that module, which an export replaced from outside misses.
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
