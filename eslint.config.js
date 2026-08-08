// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEATURES = [
  'today',
  'habits',
  'habit-form',
  'habit-detail',
  'habit-history',
  'settings',
  'onboarding',
];

const DATA_LAYER = ['./src/lib/store', './src/lib/db.ts'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*'],
  },
  {
    /* The bundled config resolves through node alone, which cannot follow
    `@/*`, and the zones rule says nothing about an unresolved path. */
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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-router',
              message:
                'A shared component does not navigate. Take a handler as a prop and let the feature route. `Color` is a theme value: import it from `@/theme`.',
            },
          ],
        },
      ],
    },
  },
]);
