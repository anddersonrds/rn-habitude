import type { SFSymbol } from "expo-symbols";

/**
 * The only custom colors in the app: each habit's accent. Everything else uses
 * `Color.ios` semantic system colors.
 */
export const HABIT_COLORS = [
  "#FF3B30", // red
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#A2D729", // lime
  "#34C759", // green
  "#00C7BE", // mint
  "#30B0C7", // teal
  "#32ADE6", // cyan
  "#007AFF", // blue
  "#5856D6", // indigo
  "#8A4FE8", // violet
  "#AF52DE", // purple
  "#E24BC0", // magenta
  "#FF2D55", // pink
] as const;

/** By value, not by index: inserting a color would silently move an index. */
export const DEFAULT_HABIT_COLOR = "#34C759"; // green

/**
 * A fixed grid of habit-relevant SF Symbols. Deliberately closed: no free-form
 * symbol search and no emoji keyboard, so every habit reads as part of one set.
 */
export const HABIT_ICONS: readonly SFSymbol[] = [
  "figure.walk",
  "figure.run",
  "figure.mind.and.body",
  "dumbbell.fill",
  "bicycle",
  "figure.pool.swim",
  "pills.fill",
  "drop.fill",
  "fork.knife",
  "carrot.fill",
  "bed.double.fill",
  "heart.fill",
  "book.fill",
  "pencil",
  "brain.head.profile",
  "laptopcomputer",
  "globe.americas.fill",
  "dollarsign.circle.fill",
  "music.note",
  "paintbrush.fill",
  "leaf.fill",
  "sun.max.fill",
  "bubble.left.and.bubble.right.fill",
  "camera.fill",
];

export const DEFAULT_HABIT_ICON = HABIT_ICONS[0];

/**
 * Catalog keys in the `schedule` namespace, indexed by weekday with Sunday
 * first to match `Date#getDay`. The abbreviation and the initial are keys of
 * their own rather than slices of the name: cutting the first three letters is
 * an English habit that produces nothing readable in Japanese or Korean.
 */
export const WEEKDAY_KEYS = [
  { name: "sunday", short: "sundayShort", initial: "sundayInitial" },
  { name: "monday", short: "mondayShort", initial: "mondayInitial" },
  { name: "tuesday", short: "tuesdayShort", initial: "tuesdayInitial" },
  { name: "wednesday", short: "wednesdayShort", initial: "wednesdayInitial" },
  { name: "thursday", short: "thursdayShort", initial: "thursdayInitial" },
  { name: "friday", short: "fridayShort", initial: "fridayInitial" },
  { name: "saturday", short: "saturdayShort", initial: "saturdayInitial" },
] as const;

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
