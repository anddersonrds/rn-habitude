import type { AndroidSymbol } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

/**
 * The Material Symbol each SF Symbol the app draws translates to.
 *
 * The persisted `icon` column stores an SF Symbol name on every platform - the
 * database has been shipping since 0.1.0, and migrating it to gain a tidier
 * stored value is risk taken for nothing a user sees. Android translates at
 * render time, here and nowhere else.
 *
 * `satisfies` rather than an annotation: an explicit `Record<string,
 * AndroidSymbol>` widens the keys and loses the narrowing, while this way a name
 * that is not a Material Symbol is a typecheck error.
 */
export const MATERIAL_SYMBOL_BY_SF = {
  /* The 24 icons a habit can be given. */
  "figure.walk": "directions_walk",
  "figure.run": "directions_run",
  "figure.mind.and.body": "self_improvement",
  "dumbbell.fill": "fitness_center",
  bicycle: "directions_bike",
  "figure.pool.swim": "pool",
  "pills.fill": "medication",
  "drop.fill": "water_drop",
  "fork.knife": "restaurant",
  "carrot.fill": "nutrition",
  "bed.double.fill": "bed",
  "heart.fill": "favorite",
  "book.fill": "menu_book",
  pencil: "edit",
  "brain.head.profile": "psychology",
  laptopcomputer: "laptop_mac",
  "globe.americas.fill": "public",
  "dollarsign.circle.fill": "paid",
  "music.note": "music_note",
  "paintbrush.fill": "brush",
  "leaf.fill": "eco",
  "sun.max.fill": "light_mode",
  "bubble.left.and.bubble.right.fill": "forum",
  "camera.fill": "photo_camera",

  /* The interface's own symbols. */
  add: "add",
  "arrow.right": "arrow_forward",
  "arrow.up.left.and.arrow.down.right": "open_in_full",
  "arrow.uturn.backward": "undo",
  "bell.badge": "notifications_active",
  "bell.fill": "notifications",
  "calendar.badge.clock": "event_upcoming",
  "chart.bar.fill": "bar_chart",
  checklist: "checklist",
  checkmark: "check",
  "checkmark.circle.fill": "check_circle",
  "checkmark.seal.fill": "verified",
  "chevron.left": "chevron_left",
  "flame.fill": "local_fire_department",
  gear: "settings",
  "gearshape.fill": "settings",
  "hand.tap.fill": "touch_app",
  "info.circle.fill": "info",
  "keyboard.chevron.compact.down": "keyboard_hide",
  "list.bullet": "format_list_bulleted",
  paperplane: "send",
  plus: "add",
  "rectangle.3.group.fill": "dashboard",
  "slider.horizontal.3": "tune",
  sparkles: "auto_awesome",
  "square.grid.2x2": "grid_view",
  "square.grid.2x2.fill": "grid_view",
  "square.grid.3x3.fill": "apps",
  trash: "delete",
  "trash.fill": "delete",
  "trophy.fill": "emoji_events",
  "wand.and.stars": "auto_fix_high",
} satisfies Record<string, AndroidSymbol>;

/**
 * What an unmapped name draws. A missing entry is a mistake to see rather than
 * one to crash on: a habit created before the map knew its icon still lists.
 */
const FALLBACK: AndroidSymbol = "question_mark";

/** The Material Symbol for a stored SF Symbol name. */
export function materialSymbolFor(name: string): AndroidSymbol {
  const known: Record<string, AndroidSymbol> = MATERIAL_SYMBOL_BY_SF;
  return known[name] ?? FALLBACK;
}

/**
 * A stored name as `SymbolView` takes it, so one call site serves both
 * platforms. The iOS half is the stored value itself, which no runtime check
 * validates - the column is a string, and an icon that left the palette would
 * already be drawing nothing on iOS.
 */
export function crossPlatformSymbol(name: string): {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
} {
  const android = materialSymbolFor(name);
  return { ios: name as SFSymbol, android, web: android };
}
