import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Rect, Path } from "react-native-svg";

const { width: W, height: H } = Dimensions.get("window");

// ─── Reusable animation pieces ────────────────────────────────────────────────

function PulseRing({ color, size, delay }: { color: string; size: number; delay: number }) {
  const scale = useSharedValue(0.25);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.0, { duration: 2400, easing: Easing.out(Easing.cubic) }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 2400, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function OrbitDot({
  radius,
  duration,
  delay,
  color,
  size = 8,
  reverse = false,
}: {
  radius: number;
  duration: number;
  delay: number;
  color: string;
  size?: number;
  reverse?: boolean;
}) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withDelay(
      delay,
      withRepeat(
        withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: -size / 2,
          left: radius - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 8,
          elevation: 6,
        }}
      />
    </Animated.View>
  );
}

function AnimatedBar({ delay, color, maxH }: { delay: number; color: string; maxH: number }) {
  const h = useSharedValue(maxH * 0.15);

  useEffect(() => {
    h.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxH * 0.88, { duration: 700, easing: Easing.out(Easing.cubic) }),
          withTiming(maxH * 0.35, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
          withTiming(maxH * 0.65, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(maxH * 0.20, { duration: 800, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <View style={{ height: maxH, justifyContent: "flex-end", alignItems: "center" }}>
      <Animated.View style={[{ width: 26, borderRadius: 8, backgroundColor: color }, style]} />
    </View>
  );
}

function FloatingPill({
  label,
  color,
  delay,
  top,
  left,
}: {
  label: string;
  color: string;
  delay: number;
  top: number;
  left: number;
}) {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          backgroundColor: color,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 24,
          flexDirection: "row",
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
    </Animated.View>
  );
}

// ─── Slide Visuals ────────────────────────────────────────────────────────────

function Visual0() {
  return (
    <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
      {/* Expanding pulse rings */}
      <PulseRing color="#8b5cf6" size={220} delay={0} />
      <PulseRing color="#06b6d4" size={160} delay={800} />
      <PulseRing color="#8b5cf6" size={100} delay={1600} />

      {/* Static orbit guide rings */}
      <View
        style={{
          position: "absolute",
          width: 184,
          height: 184,
          borderRadius: 92,
          borderWidth: 1,
          borderColor: "rgba(139,92,246,0.14)",
          borderStyle: "dashed",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 132,
          height: 132,
          borderRadius: 66,
          borderWidth: 1,
          borderColor: "rgba(6,182,212,0.14)",
          borderStyle: "dashed",
        }}
      />

      {/* Orbiting dots — outer ring */}
      <OrbitDot radius={92} duration={6000} delay={0} color="#8b5cf6" size={11} />
      <OrbitDot radius={92} duration={6000} delay={2000} color="#06b6d4" size={8} />
      <OrbitDot radius={92} duration={6000} delay={4000} color="#8b5cf6" size={6} />

      {/* Orbiting dots — inner ring (reverse) */}
      <OrbitDot radius={66} duration={4000} delay={0} color="#06b6d4" size={9} reverse />
      <OrbitDot radius={66} duration={4000} delay={2000} color="#2dd4bf" size={7} reverse />

      {/* Central lock icon */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: "rgba(139,92,246,0.18)",
          borderWidth: 2,
          borderColor: "rgba(139,92,246,0.45)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width="36" height="38" viewBox="0 0 36 38">
          {/* Shackle (top arc of lock) */}
          <Path
            d="M10 18 L10 11 A8 8 0 0 1 26 11 L26 18"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Lock body */}
          <Rect x="6" y="18" width="24" height="17" rx="5" fill="#8b5cf6" />
          {/* Keyhole circle */}
          <Circle cx="18" cy="25" r="3.5" fill="rgba(255,255,255,0.35)" />
          {/* Keyhole stem */}
          <Rect x="16.5" y="25" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.35)" />
        </Svg>
      </View>
    </View>
  );
}

function Visual1() {
  const bars = [
    { color: "#06b6d4", delay: 0 },
    { color: "#8b5cf6", delay: 140 },
    { color: "#2dd4bf", delay: 280 },
    { color: "#3b82f6", delay: 90 },
    { color: "#06b6d4", delay: 220 },
  ];
  const maxH = 130;

  // Bouncing coin
  const coinY = useSharedValue(0);
  useEffect(() => {
    coinY.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 480, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 480, easing: Easing.in(Easing.cubic) })
      ),
      -1,
      false
    );
  }, []);
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: coinY.value }] }));

  return (
    <View style={{ width: 240, alignItems: "center" }}>
      {/* Bars */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          alignItems: "flex-end",
          paddingBottom: 8,
          paddingHorizontal: 10,
        }}
      >
        {bars.map((b, i) => (
          <AnimatedBar key={i} color={b.color} delay={b.delay} maxH={maxH} />
        ))}
      </View>

      {/* Base axis line */}
      <View
        style={{
          width: 220,
          height: 1.5,
          backgroundColor: "rgba(255,255,255,0.12)",
          borderRadius: 1,
        }}
      />

      {/* Bouncing rupee coin */}
      <Animated.View style={[{ position: "absolute", top: -22, right: 14 }, coinStyle]}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#f59e0b",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#f59e0b",
            shadowOpacity: 0.65,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Poppins_700Bold" }}>₹</Text>
        </View>
      </Animated.View>

      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 20, marginTop: 14 }}>
        {[
          { label: "Income", color: "#2dd4bf" },
          { label: "Expense", color: "#8b5cf6" },
        ].map((item) => (
          <View
            key={item.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.color,
              }}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontFamily: "Inter_400Regular",
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Visual2() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 13000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Donut dimensions
  const r = 55;
  const circ = 2 * Math.PI * r; // ≈ 345.58
  // Three segments: 35%, 28%, 22% (15% gap feels intentional)
  const seg1Pct = 0.35;
  const seg2Pct = 0.28;
  const seg3Pct = 0.22;

  return (
    <View
      style={{ width: 270, height: 230, alignItems: "center", justifyContent: "center" }}
    >
      {/* Rotating donut */}
      <Animated.View style={[{ position: "absolute" }, rotStyle]}>
        <Svg width="160" height="160" viewBox="0 0 160 160">
          {/* Track ring */}
          <Circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="18"
          />
          {/* Segment 1 — teal 35% */}
          <Circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="16"
            strokeDasharray={`${circ * seg1Pct} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90, 80, 80)"
          />
          {/* Segment 2 — purple 28% */}
          <Circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="16"
            strokeDasharray={`${circ * seg2Pct} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(${-90 + 360 * seg1Pct}, 80, 80)`}
          />
          {/* Segment 3 — blue 22% */}
          <Circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="16"
            strokeDasharray={`${circ * seg3Pct} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(${-90 + 360 * (seg1Pct + seg2Pct)}, 80, 80)`}
          />
        </Svg>
      </Animated.View>

      {/* Center label (static, doesn't rotate) */}
      <View style={{ alignItems: "center" }}>
        <Text
          style={{ color: "#fff", fontSize: 20, fontFamily: "Poppins_700Bold", lineHeight: 24 }}
        >
          ₹
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 8,
            fontFamily: "Inter_600SemiBold",
            letterSpacing: 2,
          }}
        >
          WEALTH
        </Text>
      </View>

      {/* Floating category pills */}
      <FloatingPill
        label="📈  Invest"
        color="rgba(45,212,191,0.22)"
        delay={0}
        top={12}
        left={0}
      />
      <FloatingPill
        label="🏦  Loans"
        color="rgba(139,92,246,0.22)"
        delay={600}
        top={170}
        left={20}
      />
      <FloatingPill
        label="🎯  Budget"
        color="rgba(59,130,246,0.22)"
        delay={1200}
        top={12}
        left={162}
      />
    </View>
  );
}

// ─── Slide definitions ────────────────────────────────────────────────────────

type SlideData = {
  tag: string;
  title: string;
  desc: string;
  accent: string;
  gradient: [string, string, string];
  Visual: React.FC;
};

const SLIDES: SlideData[] = [
  {
    tag: "PRIVACY FIRST",
    title: "Your Data,\nYour Device",
    desc: "No cloud, no account, no internet required. Everything lives in a local SQLite database on your phone — fully offline, always private, completely yours.",
    accent: "#8b5cf6",
    gradient: ["#1a0533", "#0d0d2b", "#06060f"],
    Visual: Visual0,
  },
  {
    tag: "FULL CONTROL",
    title: "Track Every\nRupee",
    desc: "Log income, expenses, and transfers across multiple accounts. Set smart budgets, mark recurring payments, and organise with custom categories.",
    accent: "#2dd4bf",
    gradient: ["#012a2a", "#0d0d2b", "#06060f"],
    Visual: Visual1,
  },
  {
    tag: "BIG PICTURE",
    title: "Wealth.\nCrystal Clear.",
    desc: "Investments, loans, and spending insights — unified in one place. No subscriptions, no paywalls, no sign-up. Just a powerful, free financial companion.",
    accent: "#3b82f6",
    gradient: ["#0c1a3d", "#0d0d2b", "#06060f"],
    Visual: Visual2,
  },
];

// ─── Main welcome screen ──────────────────────────────────────────────────────

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const opacity = useSharedValue(1);
  const tx = useSharedValue(0);

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      // Fade + slide out
      opacity.value = withTiming(0, { duration: 190 });
      tx.value = withTiming(-32 * dir, { duration: 190 }, (done) => {
        if (done) {
          runOnJS(setSlide)(next);
          tx.value = 32 * dir;
          opacity.value = withTiming(1, { duration: 270 });
          tx.value = withTiming(0, { duration: 270, easing: Easing.out(Easing.cubic) });
        }
      });
    },
    []
  );

  const handleNext = useCallback(() => {
    if (slide < SLIDES.length - 1) goTo(slide + 1, 1);
    else onDone();
  }, [slide, goTo, onDone]);

  const handleDot = useCallback(
    (i: number) => {
      if (i !== slide) goTo(i, i > slide ? 1 : -1);
    },
    [slide, goTo]
  );

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  const { tag, title, desc, accent, gradient, Visual } = SLIDES[slide];

  return (
    <LinearGradient colors={gradient} style={styles.container} locations={[0, 0.45, 1]}>
      {/* Skip button */}
      {slide < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skip} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Animated content area */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Illustration */}
        <View style={styles.visual}>
          <Visual />
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text style={[styles.tag, { color: accent }]}>{tag}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{desc}</Text>
        </View>
      </Animated.View>

      {/* Bottom bar */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => handleDot(i)} activeOpacity={0.7}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === slide ? accent : "rgba(255,255,255,0.18)",
                    width: i === slide ? 26 : 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.btn, { backgroundColor: accent }]}
          activeOpacity={0.82}
        >
          <Text style={styles.btnText}>
            {slide === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skip: {
    position: "absolute",
    top: Platform.OS === "android" ? 48 : 62,
    right: 28,
    zIndex: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 36,
  },
  visual: {
    height: H * 0.36,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 14,
  },
  tag: {
    fontSize: 11,
    letterSpacing: 3.5,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 38,
    fontFamily: "Poppins_800ExtraBold",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 46,
  },
  desc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "android" ? 44 : 56,
    gap: 26,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btn: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
});
