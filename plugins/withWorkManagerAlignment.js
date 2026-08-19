const { withProjectBuildGradle } = require("expo/config-plugins");

/* WorkManager 2.8.0 folded the ktx classes into the main artifact, so the 2.7.1
Glance asks for duplicates the 2.8.1 the widget asks for and the build fails. */
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
