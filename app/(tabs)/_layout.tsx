import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { useApp } from "../../src/store/AppContext";
import { colors, createThemedStyles, typography } from "../../src/theme/tokens";

export default function TabsLayout() {
  const { t } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.chat"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t("tabs.cases"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: t("tabs.templates"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = createThemedStyles(() => ({
  tabBar: {
    backgroundColor: colors.glass,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    height: 84,
    paddingTop: 8,
    paddingBottom: 24,
    elevation: 0,
  },
  tabLabel: { ...typography.sm, fontWeight: "600", marginTop: 2 },
  tabItem: { paddingVertical: 2 },
}));
