const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * `react-native-android-widget` asks for `work-runtime:2.8.1` and Glance under
 * it asks for `work-runtime-ktx:2.7.1`. WorkManager 2.8.0 folded the ktx classes
 * into the main artifact, so the two resolve to the same classes and the build
 * fails on duplicates. Aligning the versions leaves one copy.
 */
const ANCHOR = "allprojects {";

const ALIGNMENT = `allprojects {
    configurations.all {
        resolutionStrategy {
            force "androidx.work:work-runtime-ktx:2.8.1"
        }
    }
`;

module.exports = function withWorkManagerAlignment(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("work-runtime-ktx")) {
      config.modResults.contents = config.modResults.contents.replace(
        ANCHOR,
        ALIGNMENT,
      );
    }

    return config;
  });
};
