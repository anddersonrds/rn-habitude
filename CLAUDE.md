# CLAUDE.md

Guidance for Claude Code working in this repository.

`README.md` and `docs/` are the source of truth and are written in Brazilian
Portuguese. This file carries the same rules in the form the tooling reads them,
and points at those documents rather than restating them.

| Document | Covers |
| --- | --- |
| [docs/arquitetura.md](docs/arquitetura.md) | Layers, import direction, the two platforms, folder anatomy, the promotion rule, what lint enforces |
| [docs/convencoes.md](docs/convencoes.md) | Naming, types, styles, tokens, icons, state, comments, the alias |
| [docs/testes.md](docs/testes.md) | The two Jest projects, test kinds, naming, snapshots, gates, coverage |

## What this is

A local-first daily habit tracker for iOS and Android. Expo SDK 57, Expo Router,
`@expo/ui` for the native screens, `expo-sqlite` for persistence, a Home Screen
widget on both platforms, and eight languages. No network, no accounts.

## Commands

```bash
bun install
bun run start            # dev server
bun run ios              # build and run on the simulator
bun run ios:device       # build and run on a connected iPhone
bun run android          # build and run on the emulator
bun run android:device   # build and run on a connected phone
bun run lint             # eslint, warnings are errors
bun run typecheck        # tsc --noEmit
bun run test             # the whole suite
bun run test:watch       # re-runs on change
bun run test:ci          # with coverage, as CI runs it
```

Run the suite through the scripts, never `jest` directly: they pin the locale
and the timezone, and the suite refuses to start without them.

Before opening a pull request:

```bash
bun run typecheck && bun run lint && bun run test:ci
```

## Rules that are easy to get wrong

**Layers import one way down.** `app/` → `features/` → `components/` →
`theme/ lib/ i18n/ constants/ config/`. A feature never imports another
feature. A shared component never imports a feature, the data layer, or
`expo-router`. `lib/utils/` never imports `lib/data/` or `lib/native/`. The
first three are lint rules, and breaking them fails the build.

**Nothing but routes and layouts goes under `src/app/`.** expo-router builds
its table from a `require.context` over the whole directory, so a barrel or a
types file placed there becomes a route with no default export. The screen
itself lives in `src/features/`.

**Every file under `src/` is kebab-case**, and the Android version of a file is
that same name plus `.android`, in the same folder. Exports keep their own
convention: PascalCase for a component, camelCase for a hook. Rename with
`git mv`. The default APFS volume is case-insensitive, so a plain `mv` leaves a
case-only rename invisible to git while breaking CI.

**A view forks per platform; a model never does.** A screen or a subcomponent
may have an `.android` sibling, and so may `lib/native/` and `theme/`, because
the platform is what those files are. `use-<x>-model`, `lib/domain/`,
`lib/data/` and `lib/utils/` do not fork. A platform suffix is not an exemption
from the import boundaries either: the lint zones match on the path.

**A single `tsc` pass only ever sees the default file.** Inside an
`.android.tsx`, an imported sibling still types as the default. When the Android
version takes props the default does not, import it by file rather than through
the folder. Metro would resolve either way; the compiler would not.

**Every symbol goes through `AppSymbol`, or `ComposeSymbol` inside a Compose
`<Host>`.** The database stores SF Symbol names on both platforms, and
`lib/utils/icons.ts` is the only place one is translated to a Material Symbol.
A new interface symbol is a new entry in that map.

**On Android, `colors` is the light palette and `useSystemColors()` follows the
appearance.** The iOS values are semantic references the system resolves; the
Material palette is concrete values resolved once at module scope. A
`StyleSheet` therefore cannot follow a scheme change on Android.

**A shared suite becomes wrong the moment its module forks.** Scope it to
`.ios` in the same commit that adds the `.android` sibling, never in the commit
after.

**A component or a hook is a folder**, holding `index.ts`, the named file,
`types.ts` when it declares a type, `styles.ts` when it has a `StyleSheet`, and
`__tests__/`. A missing file means that thing does not exist, never that it
stayed inline.

**`src/hooks/` does not exist and is not created empty.** It appears with the
first hook promoted into it, which needs a second consumer and no dependency on
the store, routing or domain copy.

**Comments are the exception, not the default.** Only where the code cannot
speak for itself, one line when possible, always `/* */` and never `//`.

**`useAppState`'s selector return is compared with `Object.is`.** A selector
building an object or array inline loops forever. One selector per slice.

**`Color` from `expo-router` is imported by `src/theme/colors.ts` and nothing
else**, on both platforms. Lint can only enforce this under `src/components/`,
and everywhere else it is convention. The accent lives alone in
`src/theme/accent.ts` so the Android widget can read it without pulling
`expo-router` into its process.

**A test moves with its module in the same commit**, so the suite is green at
every commit rather than only at the end of a change.

**Coverage globs that match nothing pass at any percentage.** When a path in
`jest.config.js` changes, check the report shows a non-zero file count for that
scope, in both projects. Green alone is not evidence.

## Language

Portuguese in `README.md` and `docs/`. English everywhere else: code, file
names, comments, test descriptions, commit messages, branch names.

## Commits and branches

Conventional Commits with the ticket prefix in the scope:

```
feat(AF-12): add the reminder time picker
fix(AF-31): keep the row from lifting outside reorder mode
docs(AF-46): rewrite the README in Portuguese
```

Branches are `af-NN-short-slug`. Never add a `Co-Authored-By` or any
AI-generated trailer to a commit or a pull request body.

## What no gate can see

Four of the seven screens are `@expo/ui` in SwiftUI, and two of those four have
a Compose sibling, so six screen files draw natively and the runner renders
neither kind. A screen can compile, pass the suite, and draw wrong.

Reordering, notifications, the widget and the version shown in Settings are
only verifiable on a device, **and one device per platform**. The two agree on
none of the four paths: different gesture, different scheduling, different
widget backend, same version string read from two builds. The Android widget's
launcher crop exists nowhere but a real home screen.

When checking the version, restart the dev server rather than reloading
JavaScript: `Constants.expoConfig` comes from the manifest the dev server
evaluated at startup.
