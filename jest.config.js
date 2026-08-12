const androidPreset = require("jest-expo/android/jest-preset");
const iosPreset = require("jest-expo/ios/jest-preset");

const BABEL_TRANSFORM = "\\.[jt]sx?$";

/**
 * One project per platform, so an `.android.tsx` file is resolved and executed
 * rather than counted by `collectCoverageFrom` and never run.
 */
function platformProject(preset, setupFilesAfterEnv = []) {
  /*
  The platform presets rebuild the babel-jest entry and keep only `caller`,
  dropping the preset the bare `jest-expo` config resolves. Without this, nothing
  strips TypeScript.
  */
  const [, babelOptions] = preset.transform[BABEL_TRANSFORM];
  /* Jest rejects this key inside a project, with a warning on every run. */
  const { watchPlugins, ...rest } = preset;

  return {
    ...rest,
    transform: {
      ...preset.transform,
      [BABEL_TRANSFORM]: [
        "babel-jest",
        { ...babelOptions, presets: [require.resolve("expo/internal/babel-preset")] },
      ],
    },
    setupFiles: [
      ...preset.setupFiles,
      require.resolve("react-native-gesture-handler/jestSetup.js"),
    ],
    /* `@formatjs` publishes ESM only, and the preset transforms nothing under
    `node_modules` but the packages it names. */
    transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
      pattern.replace("(?!(", "(?!(@formatjs|"),
    ),
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts", ...setupFilesAfterEnv],
    moduleNameMapper: {
      "^@/assets/(.*)$": "<rootDir>/assets/$1",
      "^@/(.*)$": "<rootDir>/src/$1",
    },
  };
}

/** @type {import('jest').Config} */
module.exports = {
  watchPlugins: iosPreset.watchPlugins,
  /*
  Two projects give each worker twice the suites to hold, and past this a worker
  dies inside `node:sqlite` with a SIGSEGV, two runs in three. Recycling by memory
  keeps the parallelism a worker cap would cost.
  */
  workerIdleMemoryLimit: "512MB",
  projects: [
    platformProject(iosPreset),
    platformProject(androidPreset, ["<rootDir>/jest.setup.android.ts"]),
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/test-utils/**",
    /* A `.ios.` suite is a test to one project and uncovered source to the other. */
    "!src/**/__tests__/**",
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
  /*
  Root rather than per project, so a tier measures the union of both runs and the
  numbers below mean what they meant on one platform.
  */
  coverageThreshold: {
    global: { statements: 70 },
    "./src/lib/": { statements: 90, branches: 85 },
    "./src/i18n/": { statements: 90, branches: 85 },
    "./src/features/**/hooks/**/use-*.ts": { statements: 90, branches: 85 },
    /*
    Now that every screen is covered, the roots replace the paths that were
    named one at a time while the SwiftUI screens were still uncovered.
    */
    "./src/components/": { statements: 60 },
    "./src/features/": { statements: 60 },
    /* Only layouts are left here, and a layout mounts a native navigator the
    runner cannot render. Named at 0 rather than deleted, which would sink them
    into `global` unmeasured. */
    "./src/app/": { statements: 0 },
  },
};
