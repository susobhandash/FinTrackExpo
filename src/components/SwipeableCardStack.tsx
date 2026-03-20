import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

const CARD_PEEK_H = 62;   // visible strip height per card when expanded
const CARD_FULL_H = 96;   // full rendered card height
const POUCH_H     = 168;  // wallet / pouch card height
const SLOT_H      = 42;   // card-slot pocket at top of pouch
// The pouch front (header+balance) starts below the slot
const POUCH_FRONT_H = POUCH_H - SLOT_H; // 126 px

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_GRADIENTS: Record<string, [string, string, string]> = {
  Bank: ["#0f4c81", "#072a4e", "#031524"],
  Cash: ["#065f46", "#033728", "#011a14"],
  Wallet: ["#3730a3", "#1e1b6e", "#0d0b38"],
  Credit: ["#7f1d1d", "#4a0f0f", "#220707"],
};

const CAT_ACCENT: Record<string, string> = {
  Bank:   "#38bdf8",
  Cash:   "#34d399",
  Wallet: "#a78bfa",
  Credit: "#f87171",
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
  onEdit?: (acc: Account) => void;
  onDelete?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SwipeableCardStack({
  category,
  accounts,
  isDark,
  onEdit,
  onDelete,
}: SwipeableCardStackProps) {
  const n = accounts.length;
  const [expanded, setExpanded] = useState(false);

  // Container height + pouch position
  const layoutAnim = useRef(new Animated.Value(0)).current;

  // Per-card position anims: 0 = stacked behind pouch, 1 = fully expanded
  const cardPosAnims = useRef(
    accounts.map(() => new Animated.Value(0)),
  ).current;

  // Per-card opacity anims
  const cardOpacityAnims = useRef(
    accounts.map(() => new Animated.Value(0)),
  ).current;

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || "0"),
    0,
  );

  // ── Derived layout values ────────────────────────────────────────────────

  const expandedH = n * CARD_PEEK_H + POUCH_H;

  const containerH = layoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [POUCH_H, expandedH],
  });

  const holderTop = layoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, n * CARD_PEEK_H],
  });

  // Card slides from inside the pouch (top = n * PEEK_H) upward to its expanded slot.
  // Card 0  → bottom-most slot: (n-1) * PEEK_H  (just above the pouch)
  // Card n-1 → top-most slot:    0               (furthest from pouch)
  const getCardTop = (i: number) =>
    cardPosAnims[i].interpolate({
      inputRange: [0, 1],
      outputRange: [n * CARD_PEEK_H, (n - 1 - i) * CARD_PEEK_H],
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
      // ── Expand ────────────────────────────────────────────────────────────
      // Open the container with a spring so it bounces into place
      Animated.spring(layoutAnim, {
        toValue: 1,
        tension: 54,
        friction: 13,
        useNativeDriver: false,
      }).start();

      // Card 0 emerges first (lands at bottom slot), each subsequent card peeks from behind
      Animated.stagger(
        72,
        Array.from({ length: n }, (_, k) => k).map((idx) =>
          Animated.parallel([
            Animated.spring(cardPosAnims[idx], {
              toValue: 1,
              tension: 62,
              friction: 10,
              useNativeDriver: false,
            }),
            Animated.timing(cardOpacityAnims[idx], {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
          ]),
        ),
      ).start();
    } else {
      // ── Collapse ──────────────────────────────────────────────────────────
      // Card n-1 (top-most position) retreats first, card 0 (bottom) retreats last
      Animated.stagger(
        55,
        Array.from({ length: n }, (_, k) => n - 1 - k).map((idx) =>
          Animated.parallel([
            Animated.timing(cardPosAnims[idx], {
              toValue: 0,
              duration: 190,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(cardOpacityAnims[idx], {
              toValue: 0,
              duration: 130,
              useNativeDriver: false,
            }),
          ]),
        ),
      ).start(() =>
        Animated.spring(layoutAnim, {
          toValue: 0,
          tension: 54,
          friction: 13,
          useNativeDriver: false,
        }).start(),
      );
    }

    setExpanded((prev) => !prev);
  };

  // ── Category styling ─────────────────────────────────────────────────────

  const gradColors = CAT_GRADIENTS[category] ?? [
    "#1e293b",
    "#0f172a",
    "#060c17",
  ];
  const accent = CAT_ACCENT[category] ?? "#94a3b8";
  const catIcon = CAT_ICONS[category]?.(accent);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[s.outer, { height: containerH }]}>
      {/* ── LAYER 1: Pouch back — slot strip (behind cards) ── */}
      {/*   sits at the top of the pouch position, behind account cards       */}
      <Animated.View style={[s.pouchBack, { top: holderTop, zIndex: 1 }]}>
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={s.pouchBackGrad}
        >
          {/* Deep inset shadow — makes the pocket look recessed */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.72)",
              "rgba(0,0,0,0.40)",
              "rgba(0,0,0,0.10)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {/* Accent line at very top of slot */}
          <View style={[s.slotTopLine, { backgroundColor: `${accent}70` }]} />
          {/* Card stubs visible when collapsed — only show if NOT expanded */}
          {!expanded &&
            accounts.map((acc, k) => {
              const pair = ACCOUNT_GRADIENT_PAIRS[
                parseInt(acc.color ?? "0") % ACCOUNT_GRADIENT_PAIRS.length
              ] as [string, string];
              return (
                <View
                  key={acc.id}
                  style={[
                    s.slotCardStub,
                    {
                      backgroundColor: pair[0],
                      bottom: k * 8,
                      zIndex: n - k,
                    },
                  ]}
                />
              );
            })}
        </LinearGradient>
      </Animated.View>

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
                opacity: cardOpacityAnims[i],
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
              {/* Accent shimmer line at top edge of card */}
              <View
                style={[s.cardAccentTop, { backgroundColor: `${accent}50` }]}
                pointerEvents="none"
              />

              {/* Row: account name + balance + edit/delete */}
              <View style={s.peekRow}>
                <Text style={s.accName} numberOfLines={1}>
                  {acc.name}
                </Text>
                <View style={s.balanceActions}>
                  <Text style={s.accBal}>
                    {bal < 0 ? "−" : ""}₹{fmtBal(bal)}
                  </Text>
                  {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(acc)} hitSlop={8}>
                      <Pencil size={14} color="rgba(255,255,255,0.72)" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(acc.id)}
                      hitSlop={8}
                    >
                      <X size={14} color="rgba(255,255,255,0.72)" />
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
      <Animated.View
        style={[
          s.pouchFront,
          { top: Animated.add(holderTop, SLOT_H), zIndex: n + 10 },
        ]}
      >
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.88}
          style={s.pouchTouch}
        >
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 1 }}
            style={s.pouchFrontGrad}
          >
            {/* Glassmorphism shimmer overlay */}
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.10)",
                "rgba(255,255,255,0.03)",
                "rgba(255,255,255,0.00)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1.2 }}
              style={s.pouchGlassOverlay}
              pointerEvents="none"
            />

            {/* Thin separator between slot and front */}
            <View style={[s.slotDivider, { backgroundColor: `${accent}25` }]} />

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
                <Text style={[s.pouchType, { color: accent }]}>{category}</Text>
                <Text style={s.pouchCount}>
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
              <Text style={s.pouchTotal} numberOfLines={1} adjustsFontSizeToFit>
                ₹{fmtBal(totalBalance)}
              </Text>
              <Text style={s.pouchSub}>Total Balance</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  outer: {
    marginBottom: 24,
    position: "relative",
    overflow: "hidden", // clips cards that haven't fully emerged yet
  },

  // ── Account cards ──────────────────────────────────────────────────────────
  cardSlot: {
    position: "absolute",
    left: 14,
    right: 14,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  accountCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
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
    left: 0,
    right: 0,
    height: SLOT_H,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  slotCardStub: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 22,
    borderRadius: 9,
    opacity: 0.82,
  },

  // ── Pouch front — header + balance ────────────────────────────────────────
  pouchFront: {
    position: "absolute",
    left: 0,
    right: 0,
    height: POUCH_FRONT_H,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.52,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pouchTouch: { flex: 1 },
  pouchFrontGrad: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
  },
  pouchGlassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slotDivider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  pouchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
