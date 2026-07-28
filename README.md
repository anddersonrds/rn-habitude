# habitude

A local-first daily habit tracker for iOS. Habit + attitude: check off the small
things, and watch the pattern build.

- **Today** — the day's habits as a checklist, tapped to check in, with a
  progress bar and a celebration once everything is done.
- **Habits** — a native SwiftUI list you reorder by dragging, each row showing
  its streak and a three-week heat strip.
- **History** — a GitHub-style heat graph per habit, colored with that habit's
  accent, plus current streak, best streak, and completion rate.
- **Reminders** — local notifications per habit, with a "Check in" action.
- **Widget** — the same heat graph on the Home Screen, updated whenever you
  check a habit in.

Everything lives in a local SQLite database. No accounts, no network, no
payments.

## Requirements

- Xcode 26 or newer, iOS 26 SDK
- A physical iPhone or an iOS 26 simulator
- [Bun](https://bun.sh) (the lockfile is `bun.lock`)

## Running

```bash
bun install
npx expo run:ios --device
```

The first build compiles the native project including the widget extension, so
it takes a while. Later runs reuse it.

## Stack

Expo SDK 57 with Expo Router, `@expo/ui` for native SwiftUI screens,
`expo-widgets` for the Home Screen widget, `expo-sqlite` for persistence,
`expo-notifications` for reminders, `expo-symbols` for SF Symbols,
`expo-glass-effect` for Liquid Glass, and Reanimated for the transitions.

## Layout

```
src/
  app/            file-based routes
  components/     shared UI and per-screen views
  constants/      icon grid, habit colors, layout metrics
  lib/            database, store, streak math, notifications, widget sync
  theme/          semantic colors and the navigation theme
widgets/          the Home Screen widget, built with Expo UI components
plugins/          config plugin for the widget's container background
```

## Notes

- iOS only. There are no Android code paths.
- `patches/expo-modules-jsi@57.0.4.patch` works around a Swift 6.2 compile error
  in that package (`abs(_:)` is ambiguous in a `guard`); it swaps the call for
  the equivalent `.magnitude`. Remove it once upstream ships a fix.
