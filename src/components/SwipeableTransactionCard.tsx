import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from "react-native-reanimated";
import { Pencil, Trash2, RefreshCw } from "lucide-react-native";
import type { Transaction, Account } from "@/types";
import { F } from "@/utils/fonts";

interface Props {
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
  currencySymbol?: string;
}

const ACTION_W = 72;

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function SwipeableTransactionCard({
  transaction,
  account,
  toAccount,
  onEdit,
  onDelete,
  isDark,
  currencySymbol = "₹",
}: Props) {
  const translateX = useSharedValue(0);

  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const typeColor =
    transaction.type === "Expense"
      ? "#f87171"
      : transaction.type === "Income"
        ? "#34d399"
        : "#60a5fa";

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const clamped = Math.max(Math.min(e.translationX, ACTION_W), -ACTION_W);
      translateX.value = clamped;
    })
    .onEnd((e) => {
      if (e.translationX < -ACTION_W / 2) {
        translateX.value = withSpring(-ACTION_W);
      } else if (e.translationX > ACTION_W / 2) {
        translateX.value = withSpring(ACTION_W);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = () => {
    translateX.value = withSpring(0);
    runOnJS(onDelete)(transaction.id);
  };
  const handleEdit = () => {
    translateX.value = withSpring(0);
    runOnJS(onEdit)(transaction);
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete action (swipe left reveals) */}
      <TouchableOpacity
        style={[styles.action, styles.deleteAction]}
        onPress={handleDelete}
      >
        <Trash2 size={20} color="#fff" />
      </TouchableOpacity>

      {/* Edit action (swipe right reveals) */}
      <TouchableOpacity
        style={[styles.action, styles.editAction]}
        onPress={handleEdit}
      >
        <Pencil size={20} color="#fff" />
      </TouchableOpacity>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
            cardStyle,
          ]}
        >
          {/* Type icon */}
          <View style={[styles.iconBg, { backgroundColor: `${typeColor}18` }]}>
            <Text
              style={{ color: typeColor, fontSize: 14, fontFamily: F.semi }}
            >
              {transaction.type === "Expense"
                ? "↑"
                : transaction.type === "Income"
                  ? "↓"
                  : "⇄"}
            </Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={styles.topRow}>
              <Text
                style={[styles.note, { color: textColor }]}
                numberOfLines={1}
              >
                {transaction.note || "No note"}
              </Text>
              <Text style={[styles.amount, { color: typeColor }]}>
                {transaction.type === "Expense"
                  ? "-"
                  : transaction.type === "Income"
                    ? "+"
                    : ""}
                {currencySymbol}
                {parseFloat(transaction.amount).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.bottomRow}>
              <Text style={[styles.meta, { color: subText }]}>
                {transaction.type === "Transfer"
                  ? `${account?.name ?? "—"} → ${toAccount?.name ?? "—"}`
                  : account?.name ?? "—"}{" "}
                · {formatDate(transaction.date)}
              </Text>
              {transaction.isRecurring && (
                <View
                  style={[styles.badge, { backgroundColor: `${typeColor}18` }]}
                >
                  <RefreshCw size={10} color={typeColor} />
                  <Text style={[styles.badgeText, { color: typeColor }]}>
                    Recurring
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 8,
    borderRadius: 22,
    overflow: "hidden",
  },
  action: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: ACTION_W,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  deleteAction: {
    right: 0,
    backgroundColor: "#ef4444",
  },
  editAction: {
    left: 0,
    backgroundColor: "#3b82f6",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    fontFamily: F.semi,
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontFamily: F.semi,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    fontFamily: F.body,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: F.semi,
  },
});
