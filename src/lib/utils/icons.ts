import type { AndroidSymbol } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

/**
 * The Material Symbol each SF Symbol the app draws translates to. The persisted
 * `icon` column holds the SF name on every platform, so Android translates here
 * and nowhere else.
 *
 * `satisfies` rather than an annotation: an explicit `Record<string,
 * AndroidSymbol>` widens the keys and loses the narrowing, and this way a name
 * that is not a Material Symbol is a typecheck error.
 */
export const MATERIAL_SYMBOL_BY_SF = {
  /* The habit icons. */
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
  alarm: "alarm",
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
  circle: "radio_button_unchecked",
  "exclamationmark.triangle.fill": "warning",
  "flame.fill": "local_fire_department",
  gear: "settings",
  "gearshape.fill": "settings",
  "hand.tap.fill": "touch_app",
  "info.circle.fill": "info",
  "keyboard.chevron.compact.down": "keyboard_hide",
  "line.3.horizontal": "drag_handle",
  "list.bullet": "format_list_bulleted",
  "moon.zzz.fill": "bedtime",
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

/* What an unmapped name draws, so a habit whose icon is missing still lists. */
const FALLBACK: AndroidSymbol = "question_mark";

export function materialSymbolFor(name: string): AndroidSymbol {
  const known: Record<string, AndroidSymbol> = MATERIAL_SYMBOL_BY_SF;
  return known[name] ?? FALLBACK;
}

/**
 * A stored name as `SymbolView` takes it. The cast is the column's type: an icon
 * outside the palette would already be drawing nothing on iOS.
 */
export function crossPlatformSymbol(name: string): {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
} {
  const android = materialSymbolFor(name);
  return { ios: name as SFSymbol, android, web: android };
}
