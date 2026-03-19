import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Dimensions,
  PanResponder, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Landmark, Wallet, Banknote, CreditCard } from "lucide-react-native";
import { F } from "@/utils/fonts";
import { ACCOUNT_GRADIENT_PAIRS } from "@/types";
import type { Account } from "@/types";
import GradientCard from "./GradientCard";

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Bank:   <Landmark   size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />,
  Cash:   <Banknote   size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />,
  Wallet: <Wallet     size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />,
  Credit: <CreditCard size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />,
};

const HEADER_ICONS: Record<string, (color: string) => React.ReactElement> = {
  Bank:   (c) => <Landmark   size={15} color={c} strokeWidth={1.8} />,
  Cash:   (c) => <Banknote   size={15} color={c} strokeWidth={1.8} />,
  Wallet: (c) => <Wallet     size={15} color={c} strokeWidth={1.8} />,
  Credit: (c) => <CreditCard size={15} color={c} strokeWidth={1.8} />,
};

const SCREEN_W = Dimensions.get("window").width;
const CARD_H   = 170;
const PEEK     = 12; // px each behind-card peeks from the top

interface SwipeableCardStackProps {
  category: string;
  accounts: Account[];
  isDark: boolean;
  onEdit?: (acc: Account) => void;
  onDelete?: (id: string) => void;
  containerPaddingH?: number;
}

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Bank:   ["#0c4a6e", "#0f172a"],
  Cash:   ["#064e3b", "#0f172a"],
  Wallet: ["#312e81", "#0f172a"],
  Credit: ["#7f1d1d", "#0f172a"],
};

export default function SwipeableCardStack({
  category,
  accounts,
  isDark,
  onEdit,
  onDelete,
  containerPaddingH = 20,
}: SwipeableCardStackProps) {
  const textColor   = isDark ? "#f1f5f9" : "#1e293b";
  const subText     = isDark ? "#94a3b8" : "#64748b";
  const isCredit    = category === "Credit";
  const accentColor = isCredit ? "#f87171" : "#34d399";

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || "0"),
    0
  );

  const cardW = SCREEN_W - containerPaddingH * 2;

  const baseItems = [
    { id: "__total__", isTotal: true as const },
    ...accounts.map((a, i) => ({
      id: a.id,
      isTotal: false as const,
      account: a,
      colorIdx: i,
    })),
  ];
  const n = baseItems.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const currentIdxRef = useRef(0);
  const translateX    = useRef(new Animated.Value(0)).current;

  const goTo = useCallback(
    (rawIdx: number) => {
      const next = ((rawIdx % n) + n) % n;
      currentIdxRef.current = next;
      setCurrentIdx(next);
      translateX.setValue(0);
    },
    [n, translateX]
  );

  // keep a ref so the panResponder closure always sees the latest goTo
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) + 5 && Math.abs(g.dx) > 8,
      onPanResponderMove: Animated.event([null, { dx: translateX }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        const threshold = cardW * 0.25;
        if (g.dx < -threshold || (g.dx < -10 && g.vx < -0.5)) {
          Animated.timing(translateX, {
            toValue: -cardW,
            duration: 220,
            useNativeDriver: false,
          }).start(() => goToRef.current(currentIdxRef.current + 1));
        } else if (g.dx > threshold || (g.dx > 10 && g.vx > 0.5)) {
          Animated.timing(translateX, {
            toValue: cardW,
            duration: 220,
            useNativeDriver: false,
          }).start(() => goToRef.current(currentIdxRef.current - 1));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 150,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const numBehind  = Math.min(2, n - 1);
  const containerH = CARD_H + PEEK * numBehind;

  const gradientColors: [string, string] =
    CATEGORY_GRADIENTS[category] ?? ["#1e293b", "#0f172a"];
  const headerIcon = HEADER_ICONS[category]?.(textColor);

  /** Returns the item that should be shown at stack-position `offset` from front */
  const getItem = (offset: number) =>
    baseItems[((currentIdx + offset) % n + n) % n];

  const renderItemContent = (item: typeof baseItems[0]) => {
    if (item.isTotal) {
      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <View style={styles.totalCardCircle} />
          <View style={styles.totalCardTopRow}>
            <View style={styles.totalCardIconBadge}>
              {CATEGORY_ICONS[category]}
            </View>
            <Text style={styles.totalCardCategory}>
              {category} • {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.totalCardBalance}>
            ₹{totalBalance.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.totalCardSubtitle}>Total Balance</Text>
        </LinearGradient>
      );
    }
    const colorIdx = item.account!.color !== undefined
      ? parseInt(item.account!.color, 10)
      : (item.colorIdx ?? 0);
    return (
      <GradientCard
        account={item.account!}
        colorPair={ACCOUNT_GRADIENT_PAIRS[colorIdx % ACCOUNT_GRADIENT_PAIRS.length]}
        onDelete={onDelete ? () => onDelete(item.account!.id) : undefined}
        onEdit={onEdit ? () => onEdit(item.account!) : undefined}
        style={{ flex: 1 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {headerIcon}
          <Text style={[styles.categoryLabel, { color: textColor }]}>
            {category}
          </Text>
        </View>
        <Text style={[styles.counter, { color: subText }]}>
          {currentIdx + 1} / {n}
        </Text>
      </View>

      {/* Stacked cards */}
      <View style={{ height: containerH }}>
        {/* Furthest-behind card — smallest, most transparent, top of stack */}
        {numBehind >= 2 && (
          <View
            pointerEvents="none"
            style={[styles.cardSlot, { top: 0, zIndex: 1 }]}
          >
            <View style={{ transform: [{ scaleX: 0.88 }], opacity: 0.5, flex: 1 }}>
              {renderItemContent(getItem(2))}
            </View>
          </View>
        )}

        {/* Middle-behind card */}
        {numBehind >= 1 && (
          <View
            pointerEvents="none"
            style={[styles.cardSlot, { top: PEEK, zIndex: 2 }]}
          >
            <View style={{ transform: [{ scaleX: 0.94 }], opacity: 0.72, flex: 1 }}>
              {renderItemContent(getItem(1))}
            </View>
          </View>
        )}

        {/* Front card — draggable */}
        <Animated.View
          style={[
            styles.cardSlot,
            { top: numBehind * PEEK, zIndex: 10, transform: [{ translateX }] },
          ]}
          {...panResponder.panHandlers}
        >
          {renderItemContent(getItem(0))}
        </Animated.View>
      </View>

      {/* Pagination dots */}
      {n > 1 && (
        <View style={styles.dots}>
          {baseItems.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIdx ? 18 : 6,
                  backgroundColor:
                    i === currentIdx ? accentColor : `${accentColor}40`,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryLabel: { fontSize: 14, fontFamily: F.semi },
  counter:       { fontSize: 12, fontFamily: F.body },

  /** Absolute slot that every card layer occupies */
  cardSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    height: CARD_H,
  },

  totalCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  totalCardCircle: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  totalCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalCardIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  totalCardCategory: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: F.semi,
  },
  totalCardBalance: {
    color: "#fff",
    fontSize: 28,
    fontFamily: F.heading,
    letterSpacing: -0.5,
  },
  totalCardSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: F.body,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
