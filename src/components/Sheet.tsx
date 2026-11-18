import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, createThemedStyles, radius, spacing, typography } from "../theme/tokens";

/**
 * A dependency-free bottom sheet.
 *
 * The app deliberately ships without reanimated / gesture-handler, so the sheet
 * is built from RN `Modal` + `Animated` + `PanResponder`:
 *  - slides up in 220 ms, slides down in 200 ms (spec: 200-250 ms),
 *  - closes on backdrop tap, on swipe-down (dy > 90 or a fast flick) and on the
 *    Android hardware back button,
 *  - `responsiveSide` turns it into a 320 px panel that slides in from the right
 *    on screens >= 768 px wide, with the same dimmed backdrop.
 */
export const Sheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  /** Max height as a fraction of the window (0-1). */
  maxHeight?: number;
  /** Side panel on wide screens (>= 768 px), bottom sheet on phones. */
  responsiveSide?: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ visible, onClose, maxHeight = 0.75, responsiveSide = false, title, children }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const side = responsiveSide && width >= 768;

  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState(Math.round(height * maxHeight));

  useEffect(() => {
    mountedRef.current = mounted;
  }, [mounted]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    if (!mountedRef.current) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress, drag]);

  const close = useCallback(() => onClose(), [onClose]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) drag.setValue(gesture.dy);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.6) {
            close();
          }
          Animated.spring(drag, {
            toValue: 0,
            bounciness: 0,
            speed: 20,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(drag, { toValue: 0, bounciness: 0, useNativeDriver: true }).start();
        },
      }),
    [close, drag]
  );

  if (!mounted) return null;

  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const travel = side ? Math.min(360, width) : Math.max(sheetHeight, 240);
  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] });
  const translate = side
    ? { transform: [{ translateX: Animated.add(slide, drag) }] }
    : { transform: [{ translateY: Animated.add(slide, drag) }] };

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            side ? styles.sidePanel : styles.sheet,
            side
              ? { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }
              : { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            !side && { maxHeight: height * maxHeight },
            translate,
          ]}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            if (next > 0 && Math.abs(next - sheetHeight) > 2) setSheetHeight(next);
          }}
          accessibilityViewIsModal
        >
          {side ? null : (
            <View style={styles.handleZone} {...responder.panHandlers}>
              <View style={styles.handle} />
            </View>
          )}

          {title ? (
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                onPress={close}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = createThemedStyles(() => ({
  root: { flex: 1 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sidePanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 320,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  handleZone: { paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: "center" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.heading, color: colors.onSurface, flex: 1 },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.surfaceTertiary,
  },
  closeGlyph: { fontSize: 20, lineHeight: 22, color: colors.muted, fontWeight: "600" },
  body: { flexShrink: 1, minHeight: 0, overflow: "hidden" },
}));
