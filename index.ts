/**
 * The app entry, replacing `expo-router/entry` in `package.json`: the widget's
 * background handler is registered outside React, so it answers the launcher
 * with no screen mounted.
 */
import "expo-router/entry";
import { registerAndroidWidget } from "./widgets/android/register";

registerAndroidWidget();
