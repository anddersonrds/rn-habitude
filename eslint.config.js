// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/*
One zone per feature rather than one rule, so adding a feature is one entry
here and not a new zone.
*/
const FEATURES = [
  'today',
  'habits',
  'habit-form',
  'habit-detail',
  'habit-history',
  'settings',
  'onboarding',
];

/* The data layer, until phase 8 gathers these two under `lib/data/`. */
const DATA_LAYER = ['./src/lib/store.ts', './src/lib/db.ts'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*'],
  },
  {
    /*
    The bundled config resolves through node alone, which cannot follow `@/*`.
    Without this the alias form of a forbidden import is simply unresolved, and
    an unresolved path is a path the zones rule says nothing about.
    */
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            ...FEATURES.map((feature) => ({
              target: `./src/features/${feature}`,
              from: './src/features',
              except: [`./${feature}`],
              message:
                'A feature never imports a feature. Shared logic descends into lib/.',
            })),
            {
              target: './src/components',
              from: ['./src/features', ...DATA_LAYER],
              message:
                'A shared component takes props. It never reaches up into a feature nor down into the store.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**'],
    rules: {
      /*
      `Color` is a theme value that happens to ship with the router, and it is
      the one export a shared component may take from it. Phase 5 moves it into
      `theme/` and this widens to the whole package.
      */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-router',
              allowImportNames: ['Color'],
              message:
                'A shared component does not navigate. Take a handler as a prop and let the feature route.',
            },
          ],
        },
      ],
    },
  },
]);
