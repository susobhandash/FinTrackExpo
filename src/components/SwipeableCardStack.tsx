import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Landmark, Wallet, Banknote, CreditCard,
  ChevronDown, ChevronUp, Pencil, X,
} from "lucide-react-native";
import { F } from "@/utils/fonts";
import { ACCOUNT_GRADIENT_PAIRS } from "@/types";
import type { Account } from "@/types";
import { hapticLight } from "@/utils/haptics";

// ── Constants ─────────────────────────────────────────────────────────────────

const PEEK_H    = 52;   // visible strip per account card when collapsed
const FULL_H    = 96;   // full height of each account card
const HOLDER_H  = 118;  // height of the wallet / pouch card
const CARD_GAP  = 10;   // gap between cards when expanded

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_GRADIENTS: Record<string, [string, string]> = {
  Bank:   ["#0c4a6e", "#0f172a"],
  Cash:   ["#064e3b", "#0f172a"],
  Wallet: ["#312e81", "#0f172a"],
  Credit: ["#7f1d1d", "#0f172a"],
};

const CAT_ICONS: Record<string, (color: string) => React.ReactElement> = {
  Bank:   (c) => <Landmark   size={15} color={c} strokeWidth={1.8} />,
  Cash:   (c) => <Banknote   size={15} color={c} strokeWidth={1.8} />,
  Wallet: (c) => <Wallet     size={15} color={c} strokeWidth={1.8} />,
  Credit: (c) => <CreditCard size={15} color={c} strokeWidth={1.8} />,
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
  containerPaddingH?: number;
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
  const anim = useRef(new Animated.Value(0)).current;

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || "0"), 0
  );

  // Container height transitions between collapsed and expanded
  const collapsedH = n * PEEK_H + HOLDER_H;
  const expandedH  = n * (FULL_H + CARD_GAP) + HOLDER_H;

  const containerH = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedH, expandedH],
  });

  const holderTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [n * PEEK_H, n * (FULL_H + CARD_GAP)],
  });

  const toggle = () => {
    Animated.spring(anim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
    setExpanded((prev) => !prev);
    hapticLight();
  };

  const gradColors = CAT_GRADIENTS[category] ?? (["#1e293b", "#0f172a"] as [string, string]);
  const catIcon    = CAT_ICONS[category]?.("rgba(255,255,255,0.65)");

  return (
    <Animated.View style={[s.outer, { height: containerH }]}>

      {/* ── Account cards (peek from behind holder) ── */}
      {accounts.map((acc, i) => {
        const cardTop = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [i * PEEK_H, i * (FULL_H + CARD_GAP)],
        });

        const colorPair = ACCOUNT_GRADIENT_PAIRS[
          parseInt(acc.color ?? "0") % ACCOUNT_GRADIENT_PAIRS.length
        ] as [string, string];

        const bal = parseFloat(acc.balance || "0");

        return (
          <Animated.View
            key={acc.id}
            style={[s.cardSlot, { top: cardTop, zIndex: i + 1, height: FULL_H }]}
          >
            <LinearGradient
              colors={colorPair}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.accountCard}
            >
              {/* Top row — always visible in peek */}
              <View style={s.peekRow}>
                <Text style={s.accName} numberOfLines={1}>{acc.name}</Text>
                <Text style={s.accBal}>₹{fmtBal(bal)}</Text>
              </View>

              {/* Bottom row — only visible when expanded */}
              <View style={s.expandRow}>
                <View style={s.typeBadge}>
                  <Text style={s.typeText}>{acc.type}</Text>
                </View>
                <View style={s.accActions}>
                  {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(acc)} hitSlop={8}>
                      <Pencil size={14} color="rgba(255,255,255,0.75)" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity onPress={() => onDelete(acc.id)} hitSlop={8}>
                      <X size={14} color="rgba(255,255,255,0.75)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        );
      })}

      {/* ── Wallet / pouch card ── */}
      <Animated.View
        style={[s.holderSlot, { top: holderTop, zIndex: n + 10, height: HOLDER_H }]}
      >
        <TouchableOpacity onPress={toggle} activeOpacity={0.92} style={s.holderTouch}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.holderCard}
          >
            {/* Header row */}
            <View style={s.holderHeader}>
              <View style={s.holderIconRow}>
                {catIcon}
                <Text style={s.holderCat}>{category}</Text>
                <Text style={s.holderCount}>
                  · {n} account{n !== 1 ? "s" : ""}
                </Text>
              </View>
              {expanded
                ? <ChevronUp  size={16} color="rgba(255,255,255,0.5)" />
                : <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
              }
            </View>

            {/* Balance */}
            <Text style={s.holderTotal}>₹{fmtBal(totalBalance)}</Text>
            <Text style={s.holderSub}>Total Balance</Text>
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

  // Account cards
  cardSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  accountCard: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    justifyContent: "space-between",
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
    marginRight: 10,
  },
  accBal: {
    color: "#fff",
    fontFamily: F.semi,
    fontSize: 15,
  },
  expandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  typeText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: F.semi,
    fontSize: 11,
  },
  accActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },

  // Holder / pouch card
  holderSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  holderTouch: { flex: 1 },
  holderCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  holderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  holderIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  holderCat: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: F.semi,
    fontSize: 13,
  },
  holderCount: {
    color: "rgba(255,255,255,0.4)",
    fontFamily: F.body,
    fontSize: 12,
  },
  holderTotal: {
    color: "#fff",
    fontFamily: F.heading,
    fontSize: 30,
    letterSpacing: -1,
    marginBottom: 2,
  },
  holderSub: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: F.body,
    fontSize: 11,
  },
});
