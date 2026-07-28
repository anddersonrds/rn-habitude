export const appConfig = {
  name: "habitude",
  /**
   * The app tint. This is Apple's `systemIndigo` value, kept as a hex string so
   * it can be composed with alpha suffixes and passed to native tint props.
   * Everything else uses semantic `Color.ios` colors, and each habit's accent
   * stays the only genuinely custom color in the UI.
   */
  accent: "#5856D6",
} as const;
