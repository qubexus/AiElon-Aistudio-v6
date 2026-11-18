import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../../src/store/AppContext";
import { colors, createThemedStyles, typography } from "../../src/theme/tokens";

function MenuTabButton() {
  const router = useRouter();
  const { t } = useApp();

  return (
    <Pressable
      onPress={() => router.push("/chat?menu=1")}
      accessibilityRole="button"
      accessibilityLabel={t("tabs.menu")}
      style={styles.menuButton}
    >
      <View style={styles.menuBadge}>
        <Ionicons name="grid-outline" size={22} color={colors.onAccent} />
      </View>
      <Text style={styles.menuLabel}>{t("tabs.menu")}</Text>
    </Pressable>
  );
}

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
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t("tabs.cases"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t("tabs.menu"),
          tabBarButton: () => <MenuTabButton />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: t("tabs.templates"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={26}
              color={color as string}
            />
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
  menuButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
    gap: 2,
  },
  menuBadge: {
    width: 40,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { ...typography.sm, fontWeight: "600", color: colors.muted },
}));
