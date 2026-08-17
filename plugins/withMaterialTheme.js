const {
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * The app owns its Android theme because the generated one does not expose the
 * attributes a descriptor resolves against: `Theme.AppCompat.DayNight` carries
 * `colorPrimary` and little else, while `PlatformColor("?attr/colorSurface")`
 * needs the Material 3 role set. Owning the theme is also what makes the night
 * variant and dynamic color the platform's job rather than JavaScript's.
 */
const BASE_THEME = "Theme.Habitude.Base";

/**
 * `SchemeTonalSpot` from the app accent, which is the scheme `@expo/ui`'s
 * Compose `Host` seeds itself with, so a screen and the host inside it agree.
 * These fill the roles below Android 12; from 12 on the wallpaper does.
 */
const SEED = "#32ADE6";

const LIGHT = {
  surface: "#f6fafe",
  surface_container: "#ebeef3",
  surface_container_low: "#f0f4f8",
  surface_container_high: "#e5e8ed",
  on_surface: "#181c1f",
  on_surface_variant: "#41484d",
  outline: "#71787e",
  outline_variant: "#c1c7ce",
  error: "#ba1a1a",
  on_error: "#ffffff",
  primary: "#1e6586",
  on_primary: "#ffffff",
};

const DARK = {
  surface: "#0f1417",
  surface_container: "#1c2023",
  surface_container_low: "#181c1f",
  surface_container_high: "#262b2e",
  on_surface: "#dfe3e7",
  on_surface_variant: "#c1c7ce",
  outline: "#8b9297",
  outline_variant: "#41484d",
  error: "#ffb4ab",
  on_error: "#690005",
  primary: "#91cef4",
  on_primary: "#00344a",
};

/** The role each generated color fills, in the order Material 3 names them. */
const ATTRIBUTES = [
  "colorSurface",
  "colorSurfaceContainer",
  "colorSurfaceContainerLow",
  "colorSurfaceContainerHigh",
  "colorOnSurface",
  "colorOnSurfaceVariant",
  "colorOutline",
  "colorOutlineVariant",
  "colorError",
  "colorOnError",
  "colorPrimary",
  "colorOnPrimary",
];

const RESOURCE_NAMES = Object.keys(LIGHT);

function colorsXml(palette) {
  const entries = Object.entries(palette)
    .map(([name, value]) => `  <color name="habitude_${name}">${value}</color>`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${entries}\n</resources>\n`;
}

function baseThemeXml() {
  const items = ATTRIBUTES.map(
    (attribute, index) =>
      `    <item name="${attribute}">@color/habitude_${RESOURCE_NAMES[index]}</item>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <style name="${BASE_THEME}" parent="Theme.Material3.DayNight.NoActionBar">\n${items}\n  </style>\n</resources>\n`;
}

/**
 * From Android 12 the roles come from the wallpaper, so the base theme drops
 * every color it declares and takes the dynamic parent instead. A style
 * redeclared under a qualifier replaces the whole style, not the items it
 * repeats, which is why nothing from the light file survives here.
 */
function dynamicThemeXml() {
  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <style name="${BASE_THEME}" parent="Theme.Material3.DynamicColors.DayNight.NoActionBar" />\n</resources>\n`;
}

const FILES = [
  ["values", "colors_habitude.xml", () => colorsXml(LIGHT)],
  ["values-night", "colors_habitude.xml", () => colorsXml(DARK)],
  ["values", "themes_habitude.xml", baseThemeXml],
  ["values-v31", "themes_habitude.xml", dynamicThemeXml],
];

function withHabitudeThemeResources(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const res = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      for (const [kind, file, build] of FILES) {
        const directory = path.join(res, kind);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, file), build());
      }

      return config;
    },
  ]);
}

/**
 * `AppTheme` keeps the items Expo puts on it and inherits the roles, except the
 * `colorPrimary` Expo pins: an item on the theme itself beats the one it
 * inherits, so leaving it there would override the wallpaper's primary and the
 * accent fallback alike.
 */
function withHabitudeAppTheme(config) {
  return withAndroidStyles(config, (config) => {
    for (const style of config.modResults.resources.style ?? []) {
      if (style.$.name !== "AppTheme") continue;

      style.$.parent = BASE_THEME;
      style.item = (style.item ?? []).filter(
        (item) => item.$.name !== "colorPrimary",
      );
    }

    return config;
  });
}

/**
 * A `PlatformColor` descriptor is resolved when the prop reaches the view, not
 * when the view draws, so nothing re-reads the theme while the activity lives.
 * Dropping `uiMode` is what makes Android rebuild the activity on an appearance
 * change, which is the platform's own behaviour and the only thing that makes
 * the palette follow.
 */
function withAppearanceRecreation(config) {
  return withAndroidManifest(config, (config) => {
    for (const application of config.modResults.manifest.application ?? []) {
      for (const activity of application.activity ?? []) {
        const changes = activity.$["android:configChanges"];
        if (!changes) continue;

        activity.$["android:configChanges"] = changes
          .split("|")
          .filter((change) => change !== "uiMode")
          .join("|");
      }
    }

    return config;
  });
}

module.exports = function withMaterialTheme(config) {
  return withAppearanceRecreation(
    withHabitudeAppTheme(withHabitudeThemeResources(config)),
  );
};

module.exports.SEED = SEED;
module.exports.LIGHT = LIGHT;
module.exports.DARK = DARK;
