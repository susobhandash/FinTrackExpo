import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, X, AlertTriangle, Pencil } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import type { Budget, Category } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Set Budget Form ───────────────────────────────────────────────────────────

interface SetBudgetFormProps {
  onClose: () => void;
  isDark: boolean;
}

function SetBudgetForm({ onClose, isDark }: SetBudgetFormProps) {
  const { categories, addBudget, showToast } = useApp();

  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg = isDark ? "#0f0c29" : "#f1f5f9";

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "Expense"),
    [categories]
  );

  const thisMonth = getMonthKey(new Date());

  const handleSave = async () => {
    if (!selectedCatId) {
      showToast("Select a category", "error");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    await addBudget({ categoryId: selectedCatId, amount: amt.toString(), month: thisMonth });
    showToast("Budget set");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Set Category Budget</Text>

      <Text style={[fStyles.label, { color: subText }]}>Category</Text>
      <View style={fStyles.catGrid}>
        {expenseCategories.map((cat) => {
          const active = selectedCatId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCatId(cat.id)}
              style={[
                fStyles.catChip,
                {
                  borderColor: cat.color,
                  backgroundColor: active ? cat.color : `${cat.color}18`,
                },
              ]}
            >
              <View style={[fStyles.catChipDot, { backgroundColor: active ? "#fff" : cat.color }]} />
              <Text style={[fStyles.catChipText, { color: active ? "#fff" : cat.color }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Budget Amount (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Budget</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Edit Budget Form ──────────────────────────────────────────────────────────

interface EditBudgetFormProps {
  budget: Budget;
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
  isDark: boolean;
}

function EditBudgetForm({ budget, categoryName, categoryColor, onClose, isDark }: EditBudgetFormProps) {
  const { addBudget, deleteBudget, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [amount, setAmount] = useState(budget.amount);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    // Delete old, insert updated (addBudget does an upsert by categoryId+month)
    await deleteBudget(budget.id);
    await addBudget({ categoryId: budget.categoryId, amount: amt.toString(), month: budget.month });
    showToast("Budget updated");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Edit Budget</Text>

      <View style={[fStyles.catPreview, { backgroundColor: `${categoryColor}18`, borderColor: categoryColor }]}>
        <View style={[fStyles.catChipDot, { backgroundColor: categoryColor }]} />
        <Text style={[fStyles.catPreviewText, { color: categoryColor }]}>{categoryName}</Text>
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Budget Amount (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        autoFocus
      />

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Update Budget</Text>
      </TouchableOpacity>
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 22 },
  title: { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: F.body,
    marginBottom: 4,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  catChipDot: { width: 6, height: 6, borderRadius: 3 },
  catChipText: { fontSize: 13, fontFamily: F.semi },
  catPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 4,
    marginTop: 8,
  },
  catPreviewText: { fontSize: 14, fontFamily: F.semi },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#34d399",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const { budgets, categories, transactions, addBudget, deleteBudget, config } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const now = new Date();
  const thisMonth = getMonthKey(now);
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  // Budgets for this month
  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === thisMonth),
    [budgets, thisMonth]
  );

  // Spend per category this month
  const spendMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== "Expense") return;
      const key = `${new Date(tx.date).getFullYear()}-${String(new Date(tx.date).getMonth() + 1).padStart(2, "0")}`;
      if (key !== thisMonth || !tx.categoryId) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + (parseFloat(tx.amount) || 0);
    });
    return map;
  }, [transactions, thisMonth]);

  // Enrich budgets with spend data + sort by pct descending
  const enrichedBudgets = useMemo(() => {
    return monthBudgets
      .map((b) => {
        const cat = categories.find((c) => c.id === b.categoryId);
        const total = parseFloat(b.amount) || 0;
        const spent = spendMap[b.categoryId] || 0;
        const pct = total > 0 ? (spent / total) * 100 : 0;
        const isOver = spent > total;
        return { ...b, cat, total, spent, pct, isOver };
      })
      .filter((b) => b.cat)
      .sort((a, b) => b.pct - a.pct);
  }, [monthBudgets, categories, spendMap]);

  const totalBudget = useMemo(
    () => enrichedBudgets.reduce((s, b) => s + b.total, 0),
    [enrichedBudgets]
  );
  const totalSpent = useMemo(
    () => enrichedBudgets.reduce((s, b) => s + b.spent, 0),
    [enrichedBudgets]
  );
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;

  const openSetBudgetSheet = () =>
    openSheet({ isDark, children: <SetBudgetForm onClose={closeSheet} isDark={isDark} /> });

  const openEditBudgetSheet = (b: typeof enrichedBudgets[0]) => {
    if (!b.cat) return;
    openSheet({
      isDark,
      children: (
        <EditBudgetForm
          budget={b}
          categoryName={b.cat.name}
          categoryColor={b.cat.color}
          onClose={closeSheet}
          isDark={isDark}
        />
      ),
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={["#b45309", "#1e293b"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>Budget · {monthLabel}</Text>

          {/* Summary card */}
          <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={[styles.summaryLabel, { color: subText }]}>Monthly Budget</Text>
                <Text style={[styles.summaryTotal, { color: textColor }]}>₹{fmt(totalBudget)}</Text>
              </View>
              <View
                style={[
                  styles.pctBadge,
                  { backgroundColor: overallPct > 100 ? "#f8717120" : "#34d39920" },
                ]}
              >
                <Text
                  style={[
                    styles.pctBadgeText,
                    { color: overallPct > 100 ? "#f87171" : "#34d399" },
                  ]}
                >
                  {overallPct.toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: border, marginVertical: 12 }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(overallPct, 100)}%` as any,
                    backgroundColor: overallPct > 100 ? "#f87171" : "#34d399",
                  },
                ]}
              />
            </View>

            <Text style={[styles.remainingText, { color: subText }]}>
              {remaining >= 0
                ? `₹${fmt(remaining)} remaining`
                : `Over by ₹${fmt(Math.abs(remaining))}`}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Category Budgets ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Category Budgets</Text>
            <TouchableOpacity onPress={openSetBudgetSheet} hitSlop={8}>
              <Text style={styles.addLink}>+ Set Budget</Text>
            </TouchableOpacity>
          </View>

          {enrichedBudgets.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.emptyText, { color: subText }]}>No budgets set for this month</Text>
            </View>
          ) : (
            enrichedBudgets.map((item) => {
              if (!item.cat) return null;
              const barColor = item.isOver ? "#f87171" : item.cat.color;

              return (
                <View
                  key={item.id}
                  style={[styles.budgetCard, { backgroundColor: cardBg, borderColor: border }]}
                >
                  {/* Header row */}
                  <View style={styles.budgetCardHeader}>
                    <View style={styles.budgetCardLeft}>
                      <View style={[styles.catDot, { backgroundColor: item.cat.color }]} />
                      <Text style={[styles.catName, { color: textColor }]}>{item.cat.name}</Text>
                      {item.isOver && (
                        <View style={styles.overBadge}>
                          <AlertTriangle size={10} color="#f87171" />
                          <Text style={styles.overBadgeText}>Over</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.budgetCardRight}>
                      <Text style={[styles.spentPct, { color: item.isOver ? "#f87171" : textColor }]}>
                        {item.pct.toFixed(0)}%
                      </Text>
                      <TouchableOpacity onPress={() => openEditBudgetSheet(item)} hitSlop={8}>
                        <Pencil size={15} color={subText} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteBudget(item.id)} hitSlop={8}>
                        <X size={16} color={subText} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Spent / Total */}
                  <Text style={[styles.spentLabel, { color: subText }]}>
                    ₹{fmt(item.spent)} of ₹{fmt(item.total)}
                  </Text>

                  {/* Progress bar */}
                  <View style={[styles.progressTrack, { backgroundColor: border, marginVertical: 8 }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(item.pct, 100)}%` as any,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Over by text */}
                  {item.isOver && (
                    <Text style={styles.overText}>
                      Over by ₹{fmt(item.spent - item.total)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openSetBudgetSheet} activeOpacity={0.85}>
        <Plus size={24} color="#0f172a" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Hero
  hero: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 28,
    minHeight: 230,
  },
  heroTitle: { fontSize: 24, fontFamily: F.heading, color: "#f1f5f9", marginBottom: 16 },

  // Summary card
  summaryCard: {
    borderRadius: 26,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: { fontSize: 12, fontFamily: F.body, marginBottom: 4 },
  summaryTotal: { fontSize: 26, fontFamily: F.heading },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pctBadgeText: { fontSize: 14, fontFamily: F.semi },
  remainingText: { fontSize: 12, fontFamily: F.body },

  // Progress
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontFamily: F.title },
  addLink: { fontSize: 13, fontFamily: F.semi, color: "#34d399" },

  // Budget card
  budgetCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  budgetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  budgetCardLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 14, fontFamily: F.semi },
  overBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f8717120",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  overBadgeText: { fontSize: 10, fontFamily: F.semi, color: "#f87171" },
  budgetCardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  spentPct: { fontSize: 13, fontFamily: F.semi },
  spentLabel: { fontSize: 12, fontFamily: F.body },
  overText: { fontSize: 12, fontFamily: F.semi, color: "#f87171" },

  // Empty
  emptyCard: {
    borderRadius: 22,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontFamily: F.body },

  // FAB
  fab: {
    position: "absolute",
    bottom: 110,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#34d399",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
