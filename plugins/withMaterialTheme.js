const {
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/* The generated theme inherits `Theme.AppCompat.DayNight`, which exposes no
Material 3 role for `PlatformColor("?attr/…")` to resolve against. */
const BASE_THEME = "Theme.Habitude.Base";

/* `SchemeTonalSpot` from the accent, computed once with
`@material/material-color-utilities`, whose ESM a config plugin cannot require.
These fill the roles below Android 12; from 12 on the wallpaper does. */
const ROLES = {
  colorSurface: { light: "#f6fafe", dark: "#0f1417" },
  colorSurfaceContainer: { light: "#ebeef3", dark: "#1c2023" },
  colorSurfaceContainerLow: { light: "#f0f4f8", dark: "#181c1f" },
  colorSurfaceContainerHigh: { light: "#e5e8ed", dark: "#262b2e" },
  colorOnSurface: { light: "#181c1f", dark: "#dfe3e7" },
  colorOnSurfaceVariant: { light: "#41484d", dark: "#c1c7ce" },
  colorOutline: { light: "#71787e", dark: "#8b9297" },
  colorOutlineVariant: { light: "#c1c7ce", dark: "#41484d" },
  colorError: { light: "#ba1a1a", dark: "#ffb4ab" },
  colorOnError: { light: "#ffffff", dark: "#690005" },
  colorPrimary: { light: "#1e6586", dark: "#91cef4" },
  colorOnPrimary: { light: "#ffffff", dark: "#00344a" },
};

function resources(body) {
  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${body}\n</resources>\n`;
}

function colorsXml(scheme) {
  return resources(
    Object.entries(ROLES)
      .map(
        ([role, value]) =>
          `  <color name="habitude_${role}">${value[scheme]}</color>`,
      )
      .join("\n"),
  );
}

function baseThemeXml() {
  const items = Object.keys(ROLES)
    .map((role) => `    <item name="${role}">@color/habitude_${role}</item>`)
    .join("\n");

  return resources(
    `  <style name="${BASE_THEME}" parent="Theme.Material3.DayNight.NoActionBar">\n${items}\n  </style>`,
  );
}

/* A style redeclared under a qualifier replaces the whole style, so none of the
colors above survive here and the dynamic parent fills the roles instead. */
function dynamicThemeXml() {
  return resources(
    `  <style name="${BASE_THEME}" parent="Theme.Material3.DynamicColors.DayNight.NoActionBar" />`,
  );
}

const FILES = [
  ["values", "colors_habitude.xml", () => colorsXml("light")],
  ["values-night", "colors_habitude.xml", () => colorsXml("dark")],
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

function withHabitudeAppTheme(config) {
  return withAndroidStyles(config, (config) => {
    for (const style of config.modResults.resources.style ?? []) {
      if (style.$.name !== "AppTheme") continue;

      style.$.parent = BASE_THEME;
      /* An item on the theme beats the one it inherits, so Expo's pinned
      `colorPrimary` would override the wallpaper's. */
      style.item = (style.item ?? []).filter(
        (item) => item.$.name !== "colorPrimary",
      );
    }

    return config;
  });
}

/* A descriptor is resolved when the prop reaches the view, not when the view
draws, so only a new view reads the theme again. Dropping `uiMode` is what makes
Android rebuild the activity on an appearance change. */
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
