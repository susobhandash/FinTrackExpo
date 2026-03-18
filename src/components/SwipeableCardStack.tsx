import React, { useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
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

// Header icons are slightly larger and use the section text colour
const HEADER_ICONS: Record<string, (color: string) => React.ReactElement> = {
  Bank:   (c) => <Landmark   size={15} color={c} strokeWidth={1.8} />,
  Cash:   (c) => <Banknote   size={15} color={c} strokeWidth={1.8} />,
  Wallet: (c) => <Wallet     size={15} color={c} strokeWidth={1.8} />,
  Credit: (c) => <CreditCard size={15} color={c} strokeWidth={1.8} />,
};

const SCREEN_W = Dimensions.get("window").width;

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
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const isCredit  = category === "Credit";
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

  const useLoop   = baseItems.length > 1;
  const loopItems = useLoop
    ? [...baseItems, ...baseItems, ...baseItems]
    : baseItems;
  const startOffset = useLoop ? baseItems.length * cardW : 0;

  const scrollRef  = useRef<ScrollView>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [layoutDone, setLayoutDone] = useState(false);

  const handleLayout = useCallback(() => {
    if (!layoutDone && useLoop) {
      scrollRef.current?.scrollTo({ x: startOffset, y: 0, animated: false });
      setLayoutDone(true);
    }
  }, [layoutDone, useLoop, startOffset]);

  const handleScrollEnd = useCallback(
    (e: any) => {
      if (!useLoop) return;
      const x      = e.nativeEvent.contentOffset.x;
      const rawIdx = Math.round(x / cardW);
      const n      = baseItems.length;

      if (rawIdx < n) {
        scrollRef.current?.scrollTo({ x: (rawIdx + n) * cardW, animated: false });
        setCurrentIdx(rawIdx);
      } else if (rawIdx >= 2 * n) {
        scrollRef.current?.scrollTo({ x: (rawIdx - n) * cardW, animated: false });
        setCurrentIdx(rawIdx % n);
      } else {
        setCurrentIdx(rawIdx - n);
      }
    },
    [useLoop, cardW, baseItems.length]
  );

  const gradientColors: [string, string] =
    CATEGORY_GRADIENTS[category] ?? ["#1e293b", "#0f172a"];

  const headerIcon = HEADER_ICONS[category]?.(textColor);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {headerIcon}
          <Text style={[styles.categoryLabel, { color: textColor }]}>{category}</Text>
        </View>
        <Text style={[styles.counter, { color: subText }]}>
          {currentIdx + 1} / {baseItems.length}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        onLayout={handleLayout}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {loopItems.map((item, idx) => (
          <View key={`${item.id}-${idx}`} style={{ width: cardW }}>
            {item.isTotal ? (
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
            ) : (
              <GradientCard
                account={item.account!}
                colorPair={ACCOUNT_GRADIENT_PAIRS[(item.colorIdx ?? 0) % ACCOUNT_GRADIENT_PAIRS.length]}
                onDelete={onDelete ? () => onDelete(item.account!.id) : undefined}
                onEdit={onEdit ? () => onEdit(item.account!) : undefined}
                style={{ flex: 1 }}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {baseItems.length > 1 && (
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
  totalCard: {
    height: 170,
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
