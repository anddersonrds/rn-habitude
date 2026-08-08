# CLAUDE.md

Guidance for Claude Code working in this repository.

`README.md` and `docs/` are the source of truth and are written in Brazilian
Portuguese. This file carries the same rules in the form the tooling reads them,
and points at those documents rather than restating them.

- [docs/arquitetura.md](docs/arquitetura.md) - layers, import direction, folder
  anatomy, the promotion rule, what lint enforces
- [docs/convencoes.md](docs/convencoes.md) - naming, types, styles, tokens,
  state, comments, the alias
- [docs/testes.md](docs/testes.md) - test kinds, naming, snapshots, gates,
  coverage

## What this is

A local-first daily habit tracker for iOS. Expo SDK 57, Expo Router, `@expo/ui`
for the SwiftUI screens, `expo-sqlite` for persistence, a Home Screen widget,
and eight languages. No network, no accounts.

## Commands

```bash
bun install
bun run start            # dev server
bun run ios              # build and run on the simulator
bun run ios:device       # build and run on a connected iPhone
bun run lint             # eslint, warnings are errors
bun run typecheck        # tsc --noEmit
bun run test             # the whole suite
bun run test:watch       # re-runs on change
bun run test:ci          # with coverage, as CI runs it
```

Run the suite through the scripts, never `jest` directly: they pin the locale
and the timezone, and the suite refuses to start without them.

Before opening a pull request: `bun run typecheck && bun run lint && bun run test:ci`.

## Rules that are easy to get wrong

**Layers import one way down.** `app/` → `features/` → `components/` →
`theme/ lib/ i18n/ constants/ config/`. A feature never imports another feature.
A shared component never imports a feature, the data layer, or `expo-router`.
`lib/utils/` never imports `lib/data/` or `lib/native/`. The first three are
lint rules; breaking them fails the build.

**Nothing but routes and layouts goes under `src/app/`.** expo-router builds its
table from a `require.context` over the whole directory, so a barrel or a types
file placed there becomes a route with no default export. The screen itself
lives in `src/features/`.

**Every file under `src/` is kebab-case.** Exports keep their own convention:
PascalCase for a component, camelCase for a hook. Rename with `git mv` - the
default APFS volume is case-insensitive and a plain `mv` leaves a case-only
rename invisible to git while breaking CI.

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
else.** Lint can only enforce this under `src/components/`; everywhere else it
is convention.

**A test moves with its module in the same commit**, so the suite is green at
every commit rather than only at the end of a change.

**Coverage globs that match nothing pass at any percentage.** When a path in
`jest.config.js` changes, check the report shows a non-zero file count for that
scope. Green alone is not evidence.

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

Four of the seven screens are `@expo/ui`, and the runner never renders SwiftUI.
A screen can compile, pass the suite, and draw wrong. Reordering, notifications,
the widget and the version shown in Settings are only verifiable on a device.
When checking the version, restart the dev server rather than reloading
JavaScript: `Constants.expoConfig` comes from the manifest the dev server
evaluated at startup.
