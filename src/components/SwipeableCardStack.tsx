import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Landmark, Wallet, Banknote, CreditCard, ChevronDown, ChevronUp,
} from "lucide-react-native";
import { F } from "@/utils/fonts";
import { ACCOUNT_GRADIENT_PAIRS } from "@/types";
import type { Account } from "@/types";
import { hapticLight } from "@/utils/haptics";

// ── Layout constants ───────────────────────────────────────────────────────────

const CARD_PEEK_H = 58;   // height of visible strip per card when expanded
const CARD_FULL_H = 90;   // full rendered height (rest hidden behind next card/pouch)
const POUCH_H     = 130;  // height of the wallet/pouch card

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_GRADIENTS: Record<string, [string, string, string]> = {
  Bank:   ["#0a3a5c", "#061e35", "#030f1c"],
  Cash:   ["#064e3b", "#022c22", "#011a14"],
  Wallet: ["#2e2070", "#16104a", "#0c0930"],
  Credit: ["#6b1111", "#3d0808", "#200404"],
};

const CAT_ACCENT: Record<string, string> = {
  Bank:   "#38bdf8",
  Cash:   "#34d399",
  Wallet: "#a78bfa",
  Credit: "#f87171",
};

const CAT_ICONS: Record<string, (color: string) => React.ReactElement> = {
  Bank:   (c) => <Landmark   size={14} color={c} strokeWidth={1.8} />,
  Cash:   (c) => <Banknote   size={14} color={c} strokeWidth={1.8} />,
  Wallet: (c) => <Wallet     size={14} color={c} strokeWidth={1.8} />,
  Credit: (c) => <CreditCard size={14} color={c} strokeWidth={1.8} />,
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
}: SwipeableCardStackProps) {
  const n = accounts.length;
  const [expanded, setExpanded] = useState(false);

  // Layout anim: drives container height + holder position + card positions
  const layoutAnim = useRef(new Animated.Value(0)).current;

  // Per-card fade + slide anims (staggered on expand)
  const cardAnims = useRef(
    accounts.map(() => new Animated.Value(0))
  ).current;

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || "0"), 0
  );

  // ── Derived layout values ────────────────────────────────────────────────

  const collapsedH = POUCH_H;
  const expandedH  = n * CARD_PEEK_H + POUCH_H;

  const containerH = layoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedH, expandedH],
  });

  // Pouch slides from top=0 (collapsed, fills container) to top=n*PEEK (expanded, sits at bottom)
  const holderTop = layoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, n * CARD_PEEK_H],
  });

  // Each card's top position: all start at 0 (hidden behind pouch), fan out upward on expand
  const getCardTop = (i: number) =>
    layoutAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, i * CARD_PEEK_H],
    });

  // ── Toggle ────────────────────────────────────────────────────────────────

  const toggle = () => {
    hapticLight();

    if (!expanded) {
      // Expand: spring the layout open, then stagger-fade each card in
      Animated.spring(layoutAnim, {
        toValue: 1,
        useNativeDriver: false,
        friction: 7,
        tension: 60,
      }).start();

      Animated.stagger(
        70,
        cardAnims.map((ca) =>
          Animated.timing(ca, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Collapse: fade all cards out simultaneously, then spring the layout closed
      Animated.parallel(
        cardAnims.map((ca) =>
          Animated.timing(ca, {
            toValue: 0,
            duration: 140,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        Animated.spring(layoutAnim, {
          toValue: 0,
          useNativeDriver: false,
          friction: 7,
          tension: 60,
        }).start();
      });
    }

    setExpanded((prev) => !prev);
  };

  // ── Styling ───────────────────────────────────────────────────────────────

  const gradColors = CAT_GRADIENTS[category] ?? ["#1e293b", "#0f172a", "#060c17"];
  const accent     = CAT_ACCENT[category] ?? "#94a3b8";
  const catIcon    = CAT_ICONS[category]?.(accent);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[s.outer, { height: containerH }]}>

      {/* ── Account cards — emerge from behind the pouch ── */}
      {accounts.map((acc, i) => {
        const colorPair = ACCOUNT_GRADIENT_PAIRS[
          parseInt(acc.color ?? "0") % ACCOUNT_GRADIENT_PAIRS.length
        ] as [string, string];

        const bal = parseFloat(acc.balance || "0");

        // Card fades + slides up as it appears
        const cardOpacity = cardAnims[i];
        const cardTranslateY = cardAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0], // slides up 10px as it fades in
        });

        return (
          <Animated.View
            key={acc.id}
            style={[
              s.cardSlot,
              {
                top: getCardTop(i),
                zIndex: i + 1,
                height: CARD_FULL_H,
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={colorPair}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.accountCard}
            >
              {/* Peek row: account name + balance */}
              <View style={s.peekRow}>
                <Text style={s.accName} numberOfLines={1}>{acc.name}</Text>
                <Text style={s.accBal}>
                  {bal < 0 ? "−" : ""}₹{fmtBal(bal)}
                </Text>
              </View>

              {/* Subtle accent line below name */}
              <View style={[s.accentLine, { backgroundColor: "rgba(255,255,255,0.12)" }]} />
            </LinearGradient>
          </Animated.View>
        );
      })}

      {/* ── Pouch / wallet card — sits at the bottom, always on top ── */}
      <Animated.View
        style={[
          s.pouchSlot,
          {
            top: holderTop,
            zIndex: n + 10,
            height: POUCH_H,
          },
        ]}
      >
        <TouchableOpacity onPress={toggle} activeOpacity={0.9} style={s.pouchTouch}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.pouchCard}
          >
            {/* Pouch mouth hint — subtle horizontal line at the top */}
            {expanded && (
              <View style={[s.pouchMouth, { backgroundColor: `${accent}30` }]} />
            )}

            {/* Header: category icon + type + count | chevron */}
            <View style={s.pouchHeader}>
              <View style={s.pouchLeft}>
                <View style={[s.iconDot, { backgroundColor: `${accent}22` }]}>
                  {catIcon}
                </View>
                <Text style={[s.pouchType, { color: accent }]}>{category}</Text>
                <Text style={s.pouchCount}>
                  · {n} account{n !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[s.chevronWrap, { backgroundColor: `${accent}18` }]}>
                {expanded
                  ? <ChevronDown size={14} color={accent} strokeWidth={2.5} />
                  : <ChevronUp   size={14} color={accent} strokeWidth={2.5} />
                }
              </View>
            </View>

            {/* Total balance */}
            <View style={s.pouchBalanceBlock}>
              <Text style={s.pouchTotal} numberOfLines={1}>
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
    marginBottom: 20,
    position: "relative",
  },

  // ── Account cards ──────────────────────────────────────────────────────────
  cardSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  accountCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
  },
  peekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accName: {
    color: "#fff",
    fontFamily: F.semi,
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  accBal: {
    color: "#fff",
    fontFamily: F.semi,
    fontSize: 15,
  },
  accentLine: {
    height: 1,
    marginTop: 14,
    borderRadius: 1,
  },

  // ── Pouch / holder ────────────────────────────────────────────────────────
  pouchSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  pouchTouch: { flex: 1 },
  pouchCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  pouchMouth: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  pouchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  pouchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pouchType: {
    fontFamily: F.semi,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  pouchCount: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: F.body,
    fontSize: 12,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pouchBalanceBlock: {
    gap: 4,
  },
  pouchTotal: {
    color: "#fff",
    fontFamily: F.heading,
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 38,
  },
  pouchSub: {
    color: "rgba(255,255,255,0.4)",
    fontFamily: F.body,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
