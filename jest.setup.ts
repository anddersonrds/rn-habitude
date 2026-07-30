/* eslint-disable @typescript-eslint/no-require-imports -- mock factories are
   hoisted above imports and cannot close over them, and the order the rest
   load in is load-bearing. */

/* Mocked at the module's own boundary, so the schema, the queries and the
   transactions under it are the code that ships. */
jest.mock("expo-sqlite", () => require("@/test-utils/sqlite").expoSqliteMock());

/* `ExpoWidgets` is not auto-mocked, and importing the widget takes the store
   down with it. Stubbing `createWidget` keeps the widget module real, which
   matters because the store reads a constant out of it. */
jest.mock("expo-widgets", () => ({
  createWidget: () => ({ updateSnapshot: jest.fn() }),
}));

/* Worklets has to be mocked before Reanimated's setup, which imports it. */
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);
require("react-native-reanimated").setUpTests();

require("@/test-utils/time").assertStableEnvironment();
