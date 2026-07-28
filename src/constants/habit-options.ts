import type { SFSymbol } from "expo-symbols";

/**
 * The only custom colors in the app: each habit's accent. Everything else uses
 * `Color.ios` semantic system colors.
 */
export const HABIT_COLORS = [
  "#FF3B30", // red
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#34C759", // green
  "#00C7BE", // mint
  "#30B0C7", // teal
  "#007AFF", // blue
  "#5856D6", // indigo
  "#AF52DE", // purple
  "#FF2D55", // pink
] as const;

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[3];

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

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
