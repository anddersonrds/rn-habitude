// The `ios` preset resolves a single platform. The bare `jest-expo` preset builds
// a project per platform and runs every file once for each, which would triple the
// suite to assert the same thing three times on an iOS-only app.
const iosPreset = require("jest-expo/ios/jest-preset");

// The bare preset resolves the babel options for us and falls back to
// `expo/internal/babel-preset` when the project has no babel config, which this
// one deliberately does not. The platform presets then rebuild that transform
// entry from scratch and keep only `caller`, so the preset is lost and nothing
// strips TypeScript. Put it back, and leave everything else the preset set.
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
  moduleNameMapper: {
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Scoped to `src` on purpose: it is what keeps `plugins/` and `widgets/` out.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/test-utils/**",
    // Route files that only re-export a screen. Nothing to cover, and counting
    // them would inflate the number with three-line files.
    "!src/app/habit-form.tsx",
    "!src/app/\\(onboarding\\)/index.tsx",
    "!src/app/\\(tabs\\)/\\(today\\)/index.tsx",
    "!src/app/\\(tabs\\)/habits/index.tsx",
  ],
  // Thresholds are switched on by the phase that covers each scope, never before,
  // so the check is never red waiting for work that has not happened.
  coverageThreshold: {},
};
