import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  Landmark,
  Wallet,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
} from "lucide-react-native";
import { F } from "@/utils/fonts";
import { ACCOUNT_GRADIENT_PAIRS } from "@/types";
import type { Account } from "@/types";
import { hapticLight } from "@/utils/haptics";

// ── Layout constants ───────────────────────────────────────────────────────────

const CARD_PEEK_H = 62; // visible strip height per card when expanded
const CARD_FULL_H = 96; // full rendered card height
const POUCH_H = 168; // wallet / pouch card height
const SLOT_H = 42; // card-slot pocket at top of pouch
// The pouch front (header+balance) starts below the slot
const POUCH_FRONT_H = POUCH_H - SLOT_H; // 126 px

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_GRADIENTS_DARK: Record<string, [string, string, string]> = {
  Bank: ["#0f4c81", "#072a4e", "#031524"],
  Cash: ["#065f46", "#033728", "#011a14"],
  Wallet: ["#3730a3", "#1e1b6e", "#0d0b38"],
  Credit: ["#7f1d1d", "#4a0f0f", "#220707"],
};

const CAT_GRADIENTS_LIGHT: Record<string, [string, string, string]> = {
  Bank: ["#e0f2fe", "#bae6fd", "#7dd3fc"],
  Cash: ["#d1fae5", "#a7f3d0", "#6ee7b7"],
  Wallet: ["#ede9fe", "#ddd6fe", "#c4b5fd"],
  Credit: ["#fee2e2", "#fecaca", "#fca5a5"],
};

const CAT_ACCENT_DARK: Record<string, string> = {
  Bank: "#38bdf8",
  Cash: "#34d399",
  Wallet: "#a78bfa",
  Credit: "#f87171",
};

const CAT_ACCENT_LIGHT: Record<string, string> = {
  Bank: "#0284c7",
  Cash: "#059669",
  Wallet: "#7c3aed",
  Credit: "#dc2626",
};

const CAT_WRAPPER_BG_DARK: Record<string, string> = {
  Bank: "#0c2d45",
  Cash: "#042818",
  Wallet: "#1a1560",
  Credit: "#210808",
};

const CAT_WRAPPER_BG_LIGHT: Record<string, string> = {
  Bank: "#e0f2fe",
  Cash: "#dcfce7",
  Wallet: "#f3e8ff",
  Credit: "#fee2e2",
};

const CAT_ICONS: Record<string, (color: string) => React.ReactElement> = {
  Bank: (c) => <Landmark size={16} color={c} strokeWidth={1.8} />,
  Cash: (c) => <Banknote size={16} color={c} strokeWidth={1.8} />,
  Wallet: (c) => <Wallet size={16} color={c} strokeWidth={1.8} />,
  Credit: (c) => <CreditCard size={16} color={c} strokeWidth={1.8} />,
};

function fmtBal(n: number) {
  return Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SwipeableCardStackProps {
  category: string;
  accounts: Account[];
  isDark: boolean;
  currencySymbol?: string;
  onEdit?: (acc: Account) => void;
  onDelete?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SwipeableCardStack({
  category,
  accounts,
  isDark,
  currencySymbol = "₹",
  onEdit,
  onDelete,
}: SwipeableCardStackProps) {
  const n = accounts.length;
  const [expanded, setExpanded] = useState(false);
  const [frontW, setFrontW] = useState(0);

  // Per-card position anims: 0 = collapsed (hidden at SLOT_H), 1 = fully expanded (above wrapper)
  const cardPosAnims = useRef(
    accounts.map(() => new Animated.Value(0)),
  ).current;

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || "0"),
    0,
  );

  // ── Derived layout values ────────────────────────────────────────────────

  // Collapsed: cards sit at top:SLOT_H, hidden behind pouchFront (higher zIndex)
  // Expanded:  cards float above the wrapper with negative top values
  //   card 0 (highest zIndex, bottom of stack) → nearest to pouch
  //   card n-1 (lowest zIndex, top of stack)   → furthest above
  const getCardTop = (i: number) =>
    cardPosAnims[i].interpolate({
      inputRange: [0, 1],
      outputRange: [SLOT_H, SLOT_H - (CARD_FULL_H + i * CARD_PEEK_H)],
    });

  // Card scales from slightly compressed to full as it emerges — simulates depth
  const getCardScale = (i: number) =>
    cardPosAnims[i].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.88, 0.94, 1.0],
    });

  // ── Toggle ────────────────────────────────────────────────────────────────

  const toggle = () => {
    hapticLight();

    if (!expanded) {
      // ── Expand: cards emerge upward from behind pouchFront, staggered ────
      Animated.stagger(
        65,
        Array.from({ length: n }, (_, k) => k).map((idx) =>
          Animated.spring(cardPosAnims[idx], {
            toValue: 1,
            tension: 58,
            friction: 11,
            useNativeDriver: false,
          }),
        ),
      ).start();
    } else {
      // ── Collapse: topmost card retreats first, then each below it ─────────
      Animated.stagger(
        48,
        Array.from({ length: n }, (_, k) => n - 1 - k).map((idx) =>
          Animated.timing(cardPosAnims[idx], {
            toValue: 0,
            duration: 170,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ),
      ).start();
    }

    setExpanded((prev) => !prev);
  };

  // ── Category styling ─────────────────────────────────────────────────────

  const gradColors =
    (isDark ? CAT_GRADIENTS_DARK : CAT_GRADIENTS_LIGHT)[category] ??
    (isDark
      ? (["#1e293b", "#0f172a", "#060c17"] as [string, string, string])
      : (["#f1f5f9", "#e2e8f0", "#cbd5e1"] as [string, string, string]));
  const accent =
    (isDark ? CAT_ACCENT_DARK : CAT_ACCENT_LIGHT)[category] ??
    (isDark ? "#94a3b8" : "#475569");
  const accentInverse =
    (!isDark ? CAT_ACCENT_DARK : CAT_ACCENT_LIGHT)[category] ??
    (!isDark ? "#94a3b8" : "#475569");
  const wrapperBg =
    (isDark ? CAT_WRAPPER_BG_DARK : CAT_WRAPPER_BG_LIGHT)[category] ??
    (isDark ? "#060c17" : "#f1f5f9");
  const textColor = isDark ? "#fff" : "#0f172a";
  const subTextColor = isDark ? "rgba(255,255,255,0.38)" : "rgba(15,23,42,0.5)";
  const countColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.4)";
  const pouchColor = isDark ? gradColors[0] : gradColors[1];
  const catIcon = CAT_ICONS[category]?.(accent);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[s.wrapper, { backgroundColor: wrapperBg }]}>
      <View style={s.outer}>
        {/* ── LAYER 1: Pouch back — slot strip (always visible above pouchFront) ── */}
        <View style={[s.pouchBack, { zIndex: 1 }]} />

        {/* ── LAYER 2: Account cards (emerge from within the slot) ── */}
        {accounts.map((acc, i) => {
          const colorPair = ACCOUNT_GRADIENT_PAIRS[
            parseInt(acc.color ?? "0") % ACCOUNT_GRADIENT_PAIRS.length
          ] as [string, string];
          const bal = parseFloat(acc.balance || "0");

          return (
            <Animated.View
              key={acc.id}
              style={[
                s.cardSlot,
                {
                  top: getCardTop(i),
                  // card 0 = bottommost position → highest z-index (most visible)
                  // card n-1 = topmost position  → lowest z-index (behind others)
                  zIndex: n - i + 2,
                  height: CARD_FULL_H,

                  transform: [{ scale: getCardScale(i) }],
                },
              ]}
            >
              <LinearGradient
                colors={colorPair}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.accountCard}
              >
                {/* Accent shimmer line at top edge of card
                <View
                  style={[s.cardAccentTop, { backgroundColor: `${accent}50` }]}
                  pointerEvents="none"
                /> */}

                {/* Row: account name + balance + edit/delete */}
                <View style={s.peekRow}>
                  <Text style={s.accName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <View style={s.balanceActions}>
                    <Text style={s.accBal}>
                      {bal < 0 ? "−" : ""}
                      {currencySymbol}
                      {fmtBal(bal)}
                    </Text>
                    {onEdit && (
                      <TouchableOpacity
                        onPress={() => onEdit(acc)}
                        hitSlop={8}
                        style={[
                          s.chevronWrap,
                          {
                            backgroundColor: `${accentInverse}1a`,
                            borderColor: `${accentInverse}40`,
                          },
                        ]}
                      >
                        <Pencil size={16} strokeWidth={2.4} color="#fff" />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        onPress={() => onDelete(acc.id)}
                        hitSlop={8}
                        style={[
                          s.chevronWrap,
                          {
                            backgroundColor: `${accentInverse}1a`,
                            borderColor: `${accentInverse}40`,
                          },
                        ]}
                      >
                        <X size={16} strokeWidth={2.4} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Type badge */}
                <View style={s.expandRow}>
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>{acc.type}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          );
        })}

        {/* ── LAYER 3: Pouch front — header + balance (always on top) ── */}
        <View
          style={[
            s.pouchFront,
            {
              top: SLOT_H,
              height: POUCH_FRONT_H,
              zIndex: n + 10,
            },
          ]}
          onLayout={(e) => setFrontW(e.nativeEvent.layout.width)}
        >
          <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.88}
            style={s.pouchTouch}
          >
            <View style={[s.pouchFrontGrad, { backgroundColor: pouchColor }]}>
              {/* Header row */}
              <View style={s.pouchHeader}>
                <View style={s.pouchLeft}>
                  <View
                    style={[
                      s.iconDot,
                      {
                        backgroundColor: `${accent}22`,
                        borderColor: `${accent}45`,
                      },
                    ]}
                  >
                    {catIcon}
                  </View>
                  <Text style={[s.pouchType, { color: accent }]}>
                    {category}
                  </Text>
                  <Text style={[s.pouchCount, { color: countColor }]}>
                    · {n} account{n !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View
                  style={[
                    s.chevronWrap,
                    {
                      backgroundColor: `${accent}1a`,
                      borderColor: `${accent}40`,
                    },
                  ]}
                >
                  {expanded ? (
                    <ChevronDown size={15} color={accent} strokeWidth={2.5} />
                  ) : (
                    <ChevronUp size={15} color={accent} strokeWidth={2.5} />
                  )}
                </View>
              </View>

              {/* Balance block */}
              <View style={s.pouchBalanceBlock}>
                <Text
                  style={[s.pouchTotal, { color: textColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {currencySymbol}
                  {fmtBal(totalBalance)}
                </Text>
                <Text style={[s.pouchSub, { color: subTextColor }]}>
                  Total Balance
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* SVG dashed stitched border — left, bottom (with corners), right */}
          {frontW > 0 && (
            <Svg
              width={frontW}
              height={POUCH_FRONT_H}
              style={s.stitchBorder}
              pointerEvents="none"
            >
              <Path
                d={[
                  // Left edge starts flush at x=0 (top corners are square, no clip needed)
                  `M 0 0`,
                  `L 0 ${POUCH_FRONT_H - 28}`,
                  // Bottom-left corner arc — control point inset keeps it within border-radius clip
                  `Q 3 ${POUCH_FRONT_H - 3} 29 ${POUCH_FRONT_H - 3}`,
                  // Bottom edge across
                  `L ${frontW - 29} ${POUCH_FRONT_H - 3}`,
                  // Bottom-right corner arc, then up the right edge
                  `Q ${frontW - 3} ${POUCH_FRONT_H - 3} ${frontW - 3} ${POUCH_FRONT_H - 28}`,
                  `L ${frontW - 3} 0`,
                ].join(" ")}
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.22)"}
                strokeWidth={2.5}
                strokeDasharray="18,18"
                strokeLinecap="round"
              />
            </Svg>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  outer: {
    position: "relative",
    height: POUCH_H,
    overflow: "visible",
  },

  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
    marginBottom: 20,
    borderRadius: 36,
    overflow: "visible",
  },

  // ── Account cards ──────────────────────────────────────────────────────────
  cardSlot: {
    position: "absolute",
    left: 14,
    right: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    elevation: 6,
  },
  accountCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  cardAccentTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  peekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  accName: {
    color: "#fff",
    fontFamily: F.semi,
    fontSize: 15,
    flex: 1,
  },
  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accBal: {
    color: "#fff",
    fontFamily: F.semi,
    fontSize: 15,
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  typeText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: F.semi,
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // ── Pouch back — slot strip ───────────────────────────────────────────────
  pouchBack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_H,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  pouchBackGrad: {
    flex: 1,
  },
  slotTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },

  // ── Pouch front — header + balance ────────────────────────────────────────
  pouchFront: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  stitchBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pouchTouch: { flex: 1 },
  pouchFrontGrad: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
    justifyContent: "flex-start",
  },
  pouchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pouchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pouchType: {
    fontFamily: F.semi,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  pouchCount: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: F.body,
    fontSize: 12,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pouchBalanceBlock: {
    gap: 4,
  },
  pouchTotal: {
    color: "#fff",
    fontFamily: F.heading,
    fontSize: 32,
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  pouchSub: {
    color: "rgba(255,255,255,0.38)",
    fontFamily: F.body,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
});
