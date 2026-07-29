export const appConfig = {
  name: "habitude",
  /**
   * The app tint. This is Apple's `systemCyan` value, kept as a hex string so
   * it can be composed with alpha suffixes and passed to native tint props.
   * Everything else uses semantic `Color.ios` colors, and each habit's accent
   * stays the only genuinely custom color in the UI.
   *
   * It is deliberately the same hex as the cyan habit color, so a cyan habit
   * matches app chrome. `widgets/HabitudeWidget.tsx` holds a copy of this value
   * that has to be updated by hand; it cannot import the token.
   */
  accent: "#32ADE6",
} as const;
