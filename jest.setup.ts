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
