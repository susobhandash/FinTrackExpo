import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  StyleSheet, View, TouchableWithoutFeedback, Dimensions, ScrollView,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_H = Dimensions.get("window").height;
const SNAP_THRESHOLD = 80;

interface SheetOptions {
  children: React.ReactNode;
  isDark?: boolean;
  scrollable?: boolean;
}

interface BottomSheetContextValue {
  openSheet: (opts: SheetOptions) => void;
  closeSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error("useBottomSheet must be used inside BottomSheetProvider");
  return ctx;
}

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const translateY = useSharedValue(SCREEN_H);
  const overlayOpacity = useSharedValue(0);

  const openSheet = useCallback((opts: SheetOptions) => {
    setSheet(opts);
    setVisible(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    overlayOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SCREEN_H, { duration: 220 });
    overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }, []);

  const closeSheet = useCallback(() => dismiss(), [dismiss]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > SNAP_THRESHOLD || e.velocityY > 800) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const insets = useSafeAreaInsets();
  const isDark = sheet?.isDark ?? false;
  const sheetBg = isDark ? "#1e1b4b" : "#ffffff";
  const handleColor = isDark ? "#3d3a7a" : "#d1d5db";

  const ctxValue = useMemo(() => ({ openSheet, closeSheet }), [openSheet, closeSheet]);

  return (
    <BottomSheetContext.Provider value={ctxValue}>
      {children}

      {visible && sheet && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                { backgroundColor: sheetBg, paddingBottom: insets.bottom + 12 },
                sheetStyle,
              ]}
            >
              <View style={styles.handleBar}>
                <View style={[styles.handle, { backgroundColor: handleColor }]} />
              </View>
              {sheet.scrollable !== false ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  style={{ maxHeight: SCREEN_H * 0.88 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  {sheet.children}
                </ScrollView>
              ) : (
                sheet.children
              )}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      )}
    </BottomSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.50)",
    zIndex: 9999,
    elevation: 9999,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  handleBar: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 44, height: 4, borderRadius: 2 },
});
