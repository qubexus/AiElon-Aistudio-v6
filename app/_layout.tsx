import { DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../src/store/AppContext";
import { colors } from "../src/theme/tokens";

function RootNavigator() {
  const { resolvedTheme } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="case/[id]" />
        <Stack.Screen name="template/[id]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  // Plus Jakarta Sans for the interface, DM Mono for account identifiers.
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    DMMono_500Medium,
  });

  return (
    <SafeAreaProvider>
      <AppProvider>
        {fontsLoaded ? (
          <RootNavigator />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.surface }} />
        )}
      </AppProvider>
    </SafeAreaProvider>
  );
}
