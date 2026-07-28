const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Drops the `aps-environment` entitlement that expo-notifications adds.
 *
 * That entitlement is only needed for remote push through APNs, and this app
 * schedules every reminder locally with UNUserNotificationCenter, which needs
 * no entitlement at all. Free personal teams cannot provision the Push
 * Notifications capability, so leaving it in makes the build unsignable for no
 * benefit.
 *
 * Must be listed BEFORE "expo-notifications" in the plugins array: Expo runs
 * mods in reverse registration order, so the earlier entry is the one that gets
 * the last word on the entitlements plist.
 *
 * Remove this plugin if remote push is ever added.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
