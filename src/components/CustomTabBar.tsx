import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  ArrowLeftRight,
  PieChart,
  Settings,
  Landmark,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { hapticSelection } from "@/utils/haptics";
import {
  Canvas,
  BackdropBlur,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
  rect,
  rrect,
  Blur,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");
const PILL_W = SCREEN_W - 48;
const PILL_H = 64;
const BR = 40;
const H_PAD = 4;

const ROUTE_ICONS: Record<string, React.ComponentType<any>> = {
  index: Home,
  wealth: Landmark,
  transactions: ArrowLeftRight,
  analytics: PieChart,
  settings: Settings,
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { config } = useApp();
  const isDark = config.theme === "dark";

  const routes = state.routes.filter((r) => r.name !== "budget");
  const tabCount = routes.length;
  const TAB_W = (PILL_W - H_PAD * 2) / tabCount;

  // Visual index = position in the filtered routes (excludes hidden "budget" route)
  const visualIndex = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
  const safeVisualIndex = visualIndex === -1 ? 0 : visualIndex;

  // Animate active index on UI thread → drives Skia blob position
  const activeIdx = useSharedValue(safeVisualIndex);
  useEffect(() => {
    activeIdx.value = withSpring(safeVisualIndex, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });
  }, [safeVisualIndex]);

  // Blob X in canvas space
  const blobX = useDerivedValue(() => H_PAD + activeIdx.value * TAB_W);

  // Theme
  const glassColors = isDark
    ? ["rgba(15,23,42,0.55)", "rgba(15,23,42,0.35)"]
    : ["rgba(255,255,255,0.55)", "rgba(240,253,244,0.35)"];

  const shimmerColors = [
    isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.60)",
    "rgba(255,255,255,0.00)",
  ];

  const borderColor = isDark
    ? "rgba(255,255,255,0.18)"
    : "rgba(255,255,255,0.72)";

  const blobGlowColor = isDark
    ? "rgba(52,211,153,0.28)"
    : "rgba(110,231,183,0.50)";

  const blobColor = isDark
    ? "rgba(6,95,70,0.88)"
    : "rgba(167,243,208,0.92)";

  const activeColor = isDark ? "#6ee7b7" : "#064e3b";
  const inactiveColor = "#34d399";

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.pill, { width: PILL_W, height: PILL_H }]}>

        {/* ── Skia: glass background + liquid blob ─────────────────── */}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Clip all layers to the pill shape */}
          <Group clip={rrect(rect(0, 0, PILL_W, PILL_H), BR, BR)}>

            {/* 1. Frosted backdrop blur */}
            <BackdropBlur blur={20}>
              <RoundedRect x={0} y={0} width={PILL_W} height={PILL_H} r={BR}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, PILL_H)}
                  colors={glassColors}
                />
              </RoundedRect>
            </BackdropBlur>

            {/* 2. Active blob — outer glow (blurred halo) */}
            <RoundedRect
              x={blobX}
              y={3}
              width={TAB_W}
              height={PILL_H - 6}
              r={34}
              color={blobGlowColor}
            >
              <Blur blur={12} />
            </RoundedRect>

            {/* 3. Active blob — solid fill */}
            <RoundedRect
              x={blobX}
              y={6}
              width={TAB_W}
              height={PILL_H - 12}
              r={28}
              color={blobColor}
            />

            {/* 4. Top shimmer (liquid glass highlight) */}
            <RoundedRect
              x={1}
              y={1}
              width={PILL_W - 2}
              height={PILL_H * 0.45}
              r={BR}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, PILL_H * 0.45)}
                colors={shimmerColors}
              />
            </RoundedRect>

            {/* 5. Border stroke */}
            <RoundedRect
              x={0.5}
              y={0.5}
              width={PILL_W - 1}
              height={PILL_H - 1}
              r={BR}
              color={borderColor}
              style="stroke"
              strokeWidth={1}
            />
          </Group>
        </Canvas>

        {/* ── Touch targets ──────────────────────────────────────────── */}
        <View style={styles.tabRow}>
          {routes.map((route) => {
            const index = state.routes.indexOf(route);
            const isFocused = state.index === index;
            const Icon = ROUTE_ICONS[route.name] ?? Home;

            const onPress = () => {
              hapticSelection();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                style={styles.tab}
                activeOpacity={0.8}
              >
                <Icon
                  size={21}
                  color={isFocused ? activeColor : inactiveColor}
                  strokeWidth={isFocused ? 3 : 2.2}
                />
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 16 : 28,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  pill: {
    borderRadius: BR,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  tabRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    paddingHorizontal: H_PAD,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
