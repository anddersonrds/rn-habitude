const { withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Guarantees the widget adopts the iOS 17 `containerBackground` API at the
 * Swift entry level. Without it iOS can render "Please adopt containerBackground
 * API" instead of the widget when the JS modifier is dropped during
 * serialization. The JSX modifier in widgets/HabitudeWidget.tsx still wins when
 * it applies, and these colors match it (#1C1C1E dark / #FFFFFF light).
 *
 * Runs in the xcodeproj mod phase, which is after the dangerous-mod phase where
 * expo-widgets generates ios/ExpoWidgetsTarget/HabitudeWidget.swift.
 */
const ENTRY = "WidgetsEntryView(entry: entry)";
const PATCHED = `if #available(iOS 17.0, *) {
        WidgetsEntryView(entry: entry)
          .containerBackground(for: .widget) {
            Color(UIColor { traits in
              traits.userInterfaceStyle == .dark
                ? UIColor(red: 28 / 255, green: 28 / 255, blue: 30 / 255, alpha: 1)
                : UIColor.white
            })
          }
      } else {
        WidgetsEntryView(entry: entry)
      }`;

module.exports = function withWidgetContainerBackground(config) {
  return withXcodeProject(config, (config) => {
    const file = path.join(
      config.modRequest.platformProjectRoot,
      "ExpoWidgetsTarget",
      "HabitudeWidget.swift",
    );
    if (fs.existsSync(file)) {
      const source = fs.readFileSync(file, "utf8");
      if (source.includes(ENTRY) && !source.includes("containerBackground")) {
        fs.writeFileSync(file, source.replace(ENTRY, PATCHED));
      }
    }
    return config;
  });
};
