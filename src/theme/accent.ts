/**
 * The app tint. Apple's `systemCyan`, kept as a hex string so it can be
 * composed with alpha suffixes and passed to native tint props.
 *
 * It is deliberately the same hex as the cyan habit color, so a cyan habit
 * matches app chrome. It sits alone rather than in `colors.ts` so the Android
 * widget can read it without pulling the palette, and `expo-router` under it,
 * into the widget's process. `widgets/HabitudeWidget.tsx` still holds a copy:
 * the iOS widget is serialized with no module graph and can import nothing.
 */
export const accent = "#32ADE6";
