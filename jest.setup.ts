// Mocked at `expo-sqlite`'s own public boundary, so everything below it - the
// schema, the queries, the transactions - is the code that ships.
jest.mock("expo-sqlite", () => require("@/test-utils/sqlite").expoSqliteMock());

// `ExpoWidgets` is not in the runner's auto-mock list, so importing the widget
// throws and takes the store down with it. Stubbing `createWidget` is the
// narrowest cut that keeps the widget module itself real, which matters because
// the store reads a constant out of it.
jest.mock("expo-widgets", () => ({
  createWidget: () => ({ updateSnapshot: jest.fn() }),
}));

// The animation and keyboard libraries reach for native modules at import time
// and ship their own stubs for exactly this. Every provider the app's root
// layout mounts sits behind one of them. Worklets has to be mocked before
// Reanimated's test setup runs, because Reanimated loads it on import.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);
require("react-native-reanimated").setUpTests();

// Checked before any module under test loads, so a suite running against the
// machine's locale or timezone fails on the spot rather than on one assertion.
require("@/test-utils/time").assertStableEnvironment();
