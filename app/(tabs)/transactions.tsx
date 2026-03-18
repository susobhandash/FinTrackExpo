import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import type { Transaction, Category } from "@/types";
import SwipeableTransactionCard from "@/components/SwipeableTransactionCard";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(isoDate: string): string {
  return isoDate.split("T")[0];
}

function dateLabel(dateStr: string): string {
  const today = toDateStr(new Date().toISOString());
  const yesterday = toDateStr(new Date(Date.now() - 86400000).toISOString());
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

interface TxSection {
  title: string;
  data: Transaction[];
}

function groupByDate(txList: Transaction[]): TxSection[] {
  const map: Record<string, Transaction[]> = {};
  txList.forEach((tx) => {
    const key = toDateStr(tx.date);
    if (!map[key]) map[key] = [];
    map[key].push(tx);
  });

  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      title: dateLabel(key),
      data: map[key].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
}

// ── Add / Edit Transaction Form ───────────────────────────────────────────────

interface TxFormProps {
  onClose: () => void;
  isDark: boolean;
  editTx?: Transaction;
}

function TransactionForm({ onClose, isDark, editTx }: TxFormProps) {
  const { accounts, categories, addTransaction, updateTransaction, showToast } = useApp();

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";

  const [note, setNote] = useState(editTx?.note ?? "");
  const [amount, setAmount] = useState(editTx?.amount ?? "");
  const [type, setType] = useState<"Expense" | "Income" | "Transfer">(editTx?.type ?? "Expense");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    editTx?.accountId ?? accounts[0]?.id ?? null
  );
  const [skipBalance, setSkipBalance] = useState(false);
  const [isRecurring, setIsRecurring] = useState(editTx?.isRecurring ?? false);
  const [categoryId, setCategoryId] = useState<string | null>(editTx?.categoryId ?? null);

  const filteredCategories = useMemo(
    () => categories.filter((c: Category) => c.type === type),
    [categories, type]
  );

  const typeConfig = {
    Expense: { color: "#ef4444" },
    Income: { color: "#34d399" },
    Transfer: { color: "#60a5fa" },
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (editTx) {
      await updateTransaction({
        ...editTx,
        type,
        amount: parseFloat(amount).toString(),
        note: note.trim(),
        accountId: selectedAccountId,
        categoryId,
        isRecurring: type === "Expense" ? isRecurring : false,
      });
      showToast("Transaction updated");
    } else {
      await addTransaction(
        {
          type,
          amount: parseFloat(amount).toString(),
          note: note.trim(),
          accountId: selectedAccountId,
          categoryId,
          date: new Date().toISOString(),
          isRecurring: type === "Expense" ? isRecurring : false,
        },
        skipBalance
      );
      showToast("Transaction saved");
    }
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>
        {editTx ? "Edit Transaction" : "Record Transaction"}
      </Text>

      {/* Type selector */}
      <View style={fStyles.typeRow}>
        {(["Expense", "Income", "Transfer"] as const).map((t) => {
          const cfg = typeConfig[t];
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => { setType(t); setCategoryId(null); }}
              style={[
                fStyles.typeChip,
                { borderColor: cfg.color },
                active && { backgroundColor: cfg.color },
              ]}
            >
              <Text style={[fStyles.typeChipText, { color: active ? "#fff" : cfg.color }]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount */}
      <Text style={[fStyles.label, { color: subText }]}>Amount (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Note */}
      <Text style={[fStyles.label, { color: subText }]}>Note</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="What's this for?"
        placeholderTextColor={subText}
        value={note}
        onChangeText={setNote}
      />

      {/* Account chips */}
      <Text style={[fStyles.label, { color: subText }]}>Account</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={fStyles.chipScroll}
        contentContainerStyle={fStyles.chipScrollContent}
      >
        {accounts.map((acc) => {
          const active = selectedAccountId === acc.id;
          return (
            <TouchableOpacity
              key={acc.id}
              onPress={() => setSelectedAccountId(acc.id)}
              style={[
                fStyles.chip,
                { borderColor: border, backgroundColor: active ? "#34d399" : inputBg },
              ]}
            >
              <Text style={[fStyles.chipText, { color: active ? "#fff" : textColor }]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category chips */}
      {filteredCategories.length > 0 && (
        <>
          <Text style={[fStyles.label, { color: subText }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={fStyles.chipScroll}
            contentContainerStyle={fStyles.chipScrollContent}
          >
            {filteredCategories.map((cat: Category) => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(active ? null : cat.id)}
                  style={[
                    fStyles.chip,
                    {
                      borderColor: cat.color,
                      backgroundColor: active ? cat.color : `${cat.color}18`,
                    },
                  ]}
                >
                  <Text style={[fStyles.chipText, { color: active ? "#fff" : cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Skip balance (add only) */}
      {!editTx && (
        <View style={[fStyles.switchRow, { borderColor: border }]}>
          <Text style={[fStyles.switchLabel, { color: textColor }]}>Skip balance update</Text>
          <Switch
            value={skipBalance}
            onValueChange={setSkipBalance}
            trackColor={{ false: border, true: "#34d399" }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Recurring (Expense only) */}
      {type === "Expense" && (
        <View style={[fStyles.switchRow, { borderColor: border }]}>
          <Text style={[fStyles.switchLabel, { color: textColor }]}>Monthly recurring</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: border, true: "#34d399" }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Save */}
      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>
          {editTx ? "Update Transaction" : "Save Transaction"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 16 },
  title: { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  typeChipText: { fontSize: 13, fontFamily: F.semi },
  label: { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: F.body,
    marginBottom: 4,
  },
  chipScroll: { marginBottom: 4 },
  chipScrollContent: { flexDirection: "row" as const, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: F.semi },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  switchLabel: { fontSize: 14, fontFamily: F.body },
  saveBtn: {
    marginTop: 16,
    backgroundColor: "#34d399",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
});

// ── Filter type ───────────────────────────────────────────────────────────────

type FilterType = "All" | "Expense" | "Income" | "Transfer";

const FILTER_OPTIONS: FilterType[] = ["All", "Expense", "Income", "Transfer"];

const FILTER_COLORS: Record<FilterType, string> = {
  All: "#94a3b8",
  Expense: "#ef4444",
  Income: "#34d399",
  Transfer: "#60a5fa",
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { accounts, transactions, deleteTransaction, config } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f172a" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-based
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<FilterType>("All");

  // ── Month navigation ──────────────────────────────────────────────────────

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // ── Filtered transactions ─────────────────────────────────────────────────

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  const monthTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonth
        );
      }),
    [transactions, selectedMonth, selectedYear]
  );

  const { spent, earned, saved } = useMemo(() => {
    let s = 0;
    let e = 0;
    monthTransactions.forEach((tx) => {
      if (tx.type === "Expense") s += parseFloat(tx.amount) || 0;
      if (tx.type === "Income") e += parseFloat(tx.amount) || 0;
    });
    return { spent: s, earned: e, saved: e - s };
  }, [monthTransactions]);

  const filteredTx = useMemo(
    () =>
      filterType === "All"
        ? monthTransactions
        : monthTransactions.filter((tx) => tx.type === filterType),
    [monthTransactions, filterType]
  );

  const sections = useMemo(() => groupByDate(filteredTx), [filteredTx]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddSheet = () => {
    openSheet({
      isDark,
      children: <TransactionForm onClose={closeSheet} isDark={isDark} />,
    });
  };

  const openEditSheet = (tx: Transaction) => {
    openSheet({
      isDark,
      children: (
        <TransactionForm onClose={closeSheet} isDark={isDark} editTx={tx} />
      ),
    });
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const getAccount = (id: string | null) =>
    accounts.find((a) => a.id === id);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            {/* ── Gradient Hero ── */}
            <LinearGradient
              colors={["#4f46e5", "#1e293b"]}
              style={styles.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroTitle}>Transactions</Text>

              {/* Month nav */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={prevMonth}
                  style={styles.monthNavBtn}
                  hitSlop={8}
                >
                  <ChevronLeft size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  {MONTHS[selectedMonth].toUpperCase()} {selectedYear}
                </Text>
                <TouchableOpacity
                  onPress={nextMonth}
                  style={styles.monthNavBtn}
                  hitSlop={8}
                >
                  <ChevronRight size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Summary card */}
              <View style={[styles.summaryCard, { backgroundColor: isDark ? "#1e293b" : "#ffffff" }]}>
                <View style={styles.summaryItem}>
                  <TrendingDown size={14} color="#f87171" />
                  <Text style={[styles.summaryItemLabel, { color: subText }]}>Spent</Text>
                  <Text style={[styles.summaryItemValue, { color: "#f87171" }]}>
                    ₹{spent.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={[styles.vertDivider, { backgroundColor: border }]} />
                <View style={styles.summaryItem}>
                  <TrendingUp size={14} color="#34d399" />
                  <Text style={[styles.summaryItemLabel, { color: subText }]}>Earned</Text>
                  <Text style={[styles.summaryItemValue, { color: "#34d399" }]}>
                    ₹{earned.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={[styles.vertDivider, { backgroundColor: border }]} />
                <View style={styles.summaryItem}>
                  <ArrowLeftRight size={14} color="#60a5fa" />
                  <Text style={[styles.summaryItemLabel, { color: subText }]}>Saved</Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      { color: saved >= 0 ? "#34d399" : "#f87171" },
                    ]}
                  >
                    ₹{Math.abs(saved).toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Filter chips ── */}
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map((opt) => {
                const active = filterType === opt;
                const color = FILTER_COLORS[opt];
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setFilterType(opt)}
                    style={[
                      styles.filterChip,
                      { borderColor: color },
                      active && { backgroundColor: color },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? "#fff" : color },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sections.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.emptyText, { color: subText }]}>
                  No transactions for this period
                </Text>
              </View>
            )}
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: subText }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <SwipeableTransactionCard
              transaction={item}
              account={getAccount(item.accountId)}
              onEdit={openEditSheet}
              onDelete={handleDelete}
              isDark={isDark}
            />
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddSheet} activeOpacity={0.85}>
        <Plus size={24} color="#0f172a" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingBottom: 100 },

  // Hero
  hero: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: 250,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: F.heading,
    color: "#f1f5f9",
    marginBottom: 16,
  },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 15,
    fontFamily: F.semi,
    color: "#f1f5f9",
    letterSpacing: 0.5,
    minWidth: 160,
    textAlign: "center",
  },

  // Summary card
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryItemLabel: { fontSize: 11, fontFamily: F.body },
  summaryItemValue: { fontSize: 13, fontFamily: F.semi },
  vertDivider: { width: 1, height: 36, marginHorizontal: 8 },

  // Filter chips
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 13, fontFamily: F.semi },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontFamily: F.semi,
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },

  // Card
  cardWrapper: { paddingHorizontal: 20 },

  // Empty
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    padding: 24,
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
