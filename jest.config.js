const iosPreset = require("jest-expo/ios/jest-preset");

/*
The platform presets rebuild the babel-jest entry and keep only `caller`,
dropping the preset the bare `jest-expo` config resolves. Without this, nothing
strips TypeScript.
*/
const BABEL_TRANSFORM = "\\.[jt]sx?$";
const [, babelOptions] = iosPreset.transform[BABEL_TRANSFORM];

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo/ios",
  transform: {
    ...iosPreset.transform,
    [BABEL_TRANSFORM]: [
      "babel-jest",
      { ...babelOptions, presets: [require.resolve("expo/internal/babel-preset")] },
    ],
  },
  setupFiles: [
    ...iosPreset.setupFiles,
    require.resolve("react-native-gesture-handler/jestSetup.js"),
  ],
  /* `@formatjs` publishes ESM only, and the preset transforms nothing under
  `node_modules` but the packages it names. */
  transformIgnorePatterns: iosPreset.transformIgnorePatterns.map((pattern) =>
    pattern.replace("(?!(", "(?!(@formatjs|"),
  ),
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/test-utils/**",
    /*
    Route files that only re-export a screen. The parentheses are escaped
    because a bare `(onboarding)` reads as a glob group and matches nothing.
    */
    "!src/app/habit-form.tsx",
    "!src/app/\\(onboarding\\)/index.tsx",
    "!src/app/\\(tabs\\)/\\(today\\)/index.tsx",
    "!src/app/\\(tabs\\)/habits/index.tsx",
    "!src/app/\\(tabs\\)/settings/index.tsx",
    "!src/app/habit-history.tsx",
    "!src/app/habit/\\[id\\].tsx",
  ],
  /* Each threshold is switched on by the work that covers its scope. */
  coverageThreshold: {
    global: { statements: 70 },
    "./src/lib/": { statements: 90, branches: 85 },
    "./src/i18n/": { statements: 90, branches: 85 },
    "./src/features/**/hooks/**/use-*.ts": { statements: 90, branches: 85 },
    /*
    Now that every screen is covered, the roots replace the paths that were
    named one at a time while the SwiftUI screens were still uncovered.
    The 60 that `./src/app/` carried moved to `./src/features/` with the screens
    that earned it. What is left under `./src/app/` is five `_layout.tsx` files
    and the re-exports above, and a layout mounts a native navigator the runner
    cannot render - so the tier stays named, at what it actually measures,
    rather than being deleted and letting those files sink into `global`.
    */
    "./src/components/": { statements: 60 },
    "./src/features/": { statements: 60 },
    "./src/app/": { statements: 0 },
  },
};
