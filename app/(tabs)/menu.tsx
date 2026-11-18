import React from "react";
import { View } from "react-native";

/**
 * Placeholder route for the centre "Menu" tab button. The tab bar button is
 * overridden in `_layout.tsx` and opens the quick-actions sheet inside the
 * full-screen chat, so this screen is never actually rendered.
 */
export default function MenuPlaceholder() {
  return <View />;
}
