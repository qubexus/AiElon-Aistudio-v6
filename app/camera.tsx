import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../src/components/ui";
import { useApp } from "../src/store/AppContext";
import { fontFamily, spacing } from "../src/theme/tokens";
import { deliverPhoto } from "../src/utils/cameraBus";

/**
 * Full-screen native camera. Captures a photo and hands the local URI back to
 * the screen that opened it, then pops itself off the stack.
 */
export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => router.back();

  const capture = async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, exif: false });
      if (photo?.uri) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        await deliverPhoto(photo.uri);
        router.back();
        return;
      }
    } catch {
      // Stay on screen so the user can retry.
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + spacing.xl }]}>
        <Ionicons name="camera-outline" size={44} color="#FFFFFF" />
        <Text style={styles.deniedTitle}>{t("camera.permissionTitle")}</Text>
        <Text style={styles.deniedBody}>{t("camera.permissionBody")}</Text>
        <View style={styles.deniedActions}>
          <Button label={t("camera.allow")} onPress={requestPermission} fullWidth />
          <Button label={t("common.cancel")} onPress={close} variant="ghost" fullWidth />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={close}
          style={styles.roundButton}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.hint}>{t("camera.hint")}</Text>

        <Pressable
          onPress={() => setTorch((v) => !v)}
          style={[styles.roundButton, torch && styles.roundButtonActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: torch }}
          accessibilityLabel={t("camera.torch")}
        >
          <Ionicons name={torch ? "flash" : "flash-off"} size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.roundButton}
          accessibilityRole="button"
          accessibilityLabel={t("camera.flip")}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={capture}
          disabled={busy}
          style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("camera.capture")}
        >
          {busy ? (
            <ActivityIndicator color="#141B23" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        <View style={styles.roundButtonGhost} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  centered: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  deniedTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  deniedBody: {
    fontFamily: fontFamily.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: "#B9C4CE",
    textAlign: "center",
  },
  deniedActions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.md },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: "rgba(11,15,20,0.45)",
  },
  hint: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,15,20,0.55)",
  },
  roundButtonActive: { backgroundColor: "rgba(245,158,66,0.85)" },
  roundButtonGhost: { width: 44, height: 44 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: "rgba(11,15,20,0.45)",
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shutterPressed: { transform: [{ scale: 0.96 }] },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
});
