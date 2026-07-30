/* eslint-disable @typescript-eslint/no-require-imports --
mock factories are hoisted above imports and cannot close over them, and the
order the rest load in is load-bearing.
*/

/*
Mocked at the module's own boundary, so the schema, the queries and the
transactions under it are the code that ships.
*/
jest.mock("expo-sqlite", () => require("@/test-utils/sqlite").expoSqliteMock());

/*
`ExpoWidgets` is not auto-mocked, and importing the widget takes the store down
with it. Stubbing `createWidget` keeps the widget module real, which matters
because the store reads a constant out of it.
*/
jest.mock("expo-widgets", () => ({
  createWidget: () => ({ updateSnapshot: jest.fn() }),
}));

/*
The gesture handler's own mock swaps `BaseButton` - which is what `pressto`
renders - for a `TouchableNativeFeedback`, and that takes a single child.
Every button in this app that puts an icon beside its label hands it two, so
the stand-in wraps them. Accessibility props still reach the wrapper, which is
what a role query finds.
*/
jest.mock("react-native-gesture-handler", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");
  const actual = jest.requireActual<typeof import("react-native-gesture-handler")>(
    "react-native-gesture-handler",
  );

  function Button({ children, ...rest }: { children?: React.ReactNode }) {
    return React.createElement(
      actual.BaseButton,
      rest,
      React.createElement(View, null, children),
    );
  }

  return {
    __esModule: true,
    ...actual,
    BaseButton: Button,
    RawButton: Button,
    RectButton: Button,
  };
});

/*
Insets come from the native view rather than from a provider the app renders,
so a screen reading them throws under the runner. The package ships this mock
for exactly that; it keeps the contexts real and defaults the insets to zero.
*/
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);

/* Worklets has to be mocked before Reanimated's setup, which imports it. */
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);
require("react-native-reanimated").setUpTests();

require("@/test-utils/time").assertStableEnvironment();
