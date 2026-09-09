// https://docs.expo.dev/guides/using-eslint/
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
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

const DATA_LAYER = ['./src/lib/data'];

/* The half only iOS reads: a `.ios` file, or a default file with an `.android`
sibling, which is how a view forks here. */
function collectIosOnly(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) collectIosOnly(file, found);
    else if (entry.name.includes('.ios.')) found.push(file);
    else if (entry.name.includes('.android.'))
      found.push(file.replace('.android.', '.'));
  }
  return found;
}

const IOS_ONLY_FILES = collectIosOnly('src');

const IOS_ONLY_APIS = [
  {
    selector: 'JSXAttribute[name.name="contentInsetAdjustmentBehavior"]',
    message:
      '`contentInsetAdjustmentBehavior` is honoured by iOS alone. Give the screen an `.android` sibling that pads its own content past the header.',
  },
  {
    selector: 'Property[key.name="headerLargeTitleEnabled"]',
    message:
      '`headerLargeTitleEnabled` is honoured by iOS alone. Android draws the title in the screen content, so fork the screen options into an `.android` sibling.',
  },
  {
    selector: 'Property[key.name="borderCurve"]',
    message:
      '`borderCurve` is honoured by iOS alone. Declare it in a file only iOS reads, and leave the radius itself shared.',
  },
  {
    selector: 'JSXMemberExpression[object.name="Stack"][property.name="Toolbar"]',
    message:
      '`Stack.Toolbar` renders nothing on Android. Give the screen an `.android` sibling that puts the action in `headerRight`.',
  },
  {
    selector: 'Property[key.name="presentation"][value.value="formSheet"]',
    message:
      '`presentation: "formSheet"` is honoured by iOS alone. Fork the presentation into an `.android` sibling.',
  },
];

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
            {
              target: './src/lib/utils',
              from: [...DATA_LAYER, './src/lib/native'],
              message:
                'lib/utils/ is pure. A helper that needs the database or the platform belongs in lib/data/ or lib/native/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...IOS_ONLY_APIS],
    },
  },
  {
    files: IOS_ONLY_FILES,
    rules: {
      'no-restricted-syntax': 'off',
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
