import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Pencil, Landmark, Wallet, Banknote, CreditCard } from "lucide-react-native";
import type { Account } from "@/types";
import { F } from "@/utils/fonts";

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactElement> = {
  Bank:   <Landmark   size={11} color="#fff" strokeWidth={1.8} />,
  Cash:   <Banknote   size={11} color="#fff" strokeWidth={1.8} />,
  Wallet: <Wallet     size={11} color="#fff" strokeWidth={1.8} />,
  Credit: <CreditCard size={11} color="#fff" strokeWidth={1.8} />,
};

interface GradientCardProps {
  account: Account;
  colorPair: [string, string];
  onPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  style?: object;
}

export default function GradientCard({
  account, colorPair, onPress, onDelete, onEdit, style,
}: GradientCardProps) {
  const maskedId = account.id ? account.id.slice(-4).padStart(8, "•") : "••••••••";
  const balance = parseFloat(account.balance || "0");

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1} style={style}>
      <LinearGradient
        colors={colorPair}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative circles */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.typeBadge}>
            {ACCOUNT_TYPE_ICONS[account.type]}
            <Text style={styles.typeText}>{account.type}</Text>
          </View>
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={12}>
                <Pencil size={13} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={12}>
                <X size={14} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Balance */}
        <Text style={styles.balance} numberOfLines={1}>
          ₹{balance.toLocaleString("en-IN")}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.accountId}>•••• {maskedId.slice(-4)}</Text>
          <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  circleTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -40,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: F.semi,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    backgroundColor: "rgba(0,0,0,0.2)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  balance: {
    color: "#fff",
    fontSize: 28,
    fontFamily: F.heading,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountId: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: F.body,
    letterSpacing: 2,
  },
  accountName: {
    color: "#fff",
    fontSize: 13,
    fontFamily: F.semi,
    maxWidth: 120,
  },
});
