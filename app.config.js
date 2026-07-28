/**
 * The Home Screen widget shares data with the app through an App Group, and
 * App Groups need a paid Apple Developer membership. On a free personal team
 * the entitlement is rejected for the widget target *and* for the main app, so
 * the whole build fails to sign.
 *
 * Keeping the widget behind a flag means the default build installs on any
 * device, while `HABITUDE_WIDGET=1` restores the widget in full. The simulator
 * doesn't check provisioning, so the widget is completely testable there with
 * real data even without a paid account.
 */
const widgetEnabled = process.env.HABITUDE_WIDGET === "1";

const widgetPlugins = [
  [
    "expo-widgets",
    {
      widgets: [
        {
          name: "HabitudeWidget",
          displayName: "Consistency",
          description: "Your habit heat graph at a glance.",
          supportedFamilies: ["systemSmall", "systemMedium"],
          contentMarginsDisabled: true,
        },
      ],
    },
  ],
  "./plugins/withWidgetContainerBackground",
];

module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), ...(widgetEnabled ? widgetPlugins : [])],
});
