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
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Plus, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, ArrowLeftRight,
  Landmark, Wallet, Banknote, CreditCard, Check,
} from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import type { Transaction, Category } from "@/types";
import SwipeableTransactionCard from "@/components/SwipeableTransactionCard";
import AnalysisCard from "@/components/AnalysisCard";

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

// ── Avatar helpers ────────────────────────────────────────────────────────────

const ACCOUNT_AVATAR: Record<string, { bg: string; Icon: React.ComponentType<any> }> = {
  Bank:   { bg: "#0c4a6e", Icon: Landmark },
  Cash:   { bg: "#064e3b", Icon: Banknote },
  Wallet: { bg: "#312e81", Icon: Wallet },
  Credit: { bg: "#7f1d1d", Icon: CreditCard },
};

function AccountAvatar({ type, size = 44 }: { type: string; size?: number }) {
  const cfg = ACCOUNT_AVATAR[type] ?? { bg: "#334155", Icon: Wallet };
  const { Icon } = cfg;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: cfg.bg, justifyContent: "center", alignItems: "center" }}>
      <Icon size={size * 0.42} color="#fff" strokeWidth={1.8} />
    </View>
  );
}

function CategoryAvatar({ color, name, size = 44 }: { color: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontFamily: F.semi }}>
        {name[0]?.toUpperCase() ?? "?"}
      </Text>
    </View>
  );
}

// ── Generic list-picker modal ─────────────────────────────────────────────────

interface PickerItem {
  id: string;
  label: string;
  bgColor: string;
  Icon?: React.ComponentType<any>;
}

function ItemPickerModal({
  visible, title, items, selectedId, onSelect, onClose, isDark,
}: {
  visible: boolean; title: string; items: PickerItem[];
  selectedId: string | null; onSelect: (id: string) => void;
  onClose: () => void; isDark: boolean;
}) {
  const bg      = isDark ? "#1e1b4b" : "#ffffff";
  const pageBg  = isDark ? "#0f0c29" : "#f8fafc";
  const text    = isDark ? "#f1f5f9" : "#1e293b";
  const divider = isDark ? "#2d2b5e" : "#f1f5f9";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <View style={[pmStyles.header, { backgroundColor: bg, borderBottomColor: divider }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={pmStyles.backBtn}>
            <ChevronLeft size={24} color={text} />
          </TouchableOpacity>
          <Text style={[pmStyles.headerTitle, { color: text }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
          {items.map((item, idx) => {
            const selected = item.id === selectedId;
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  onPress={() => { onSelect(item.id); onClose(); }}
                  style={[pmStyles.row, selected && { backgroundColor: `${item.bgColor}18` }]}
                  activeOpacity={0.7}
                >
                  <View style={[pmStyles.iconCircle, { backgroundColor: item.bgColor }]}>
                    {item.Icon
                      ? <item.Icon size={24} color="#fff" strokeWidth={1.8} />
                      : <Text style={pmStyles.iconLetter}>{item.label[0]?.toUpperCase()}</Text>
                    }
                  </View>
                  <Text style={[pmStyles.rowLabel, { color: text }]}>{item.label}</Text>
                  {selected && <Check size={22} color="#34d399" strokeWidth={2.5} />}
                </TouchableOpacity>
                {idx < items.length - 1 && (
                  <View style={[pmStyles.divider, { backgroundColor: divider }]} />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pmStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: F.title },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
    marginRight: 16, elevation: 3,
  },
  iconLetter: { color: "#fff", fontSize: 22, fontFamily: F.semi },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: F.semi },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
});

// ── Add / Edit Transaction Form ───────────────────────────────────────────────

interface TxFormProps {
  onClose: () => void;
  isDark: boolean;
  editTx?: Transaction;
}

function TransactionForm({ onClose, isDark, editTx }: TxFormProps) {
  const { accounts, categories, addTransaction, updateTransaction, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [note, setNote]     = useState(editTx?.note ?? "");
  const [amount, setAmount] = useState(editTx?.amount ?? "");
  const [type, setType]     = useState<"Expense" | "Income" | "Transfer">(editTx?.type ?? "Expense");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    editTx?.accountId ?? accounts[0]?.id ?? null
  );
  const [skipBalance, setSkipBalance]           = useState(false);
  const [isRecurring, setIsRecurring]           = useState(editTx?.isRecurring ?? false);
  const [categoryId, setCategoryId]             = useState<string | null>(editTx?.categoryId ?? null);
  const [showAccountPicker, setShowAccountPicker]   = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c: Category) => c.type === type),
    [categories, type]
  );

  const typeConfig = {
    Expense:  { color: "#ef4444" },
    Income:   { color: "#34d399" },
    Transfer: { color: "#60a5fa" },
  };

  const selectedAccount  = accounts.find((a) => a.id === selectedAccountId);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);

  const accountItems: PickerItem[] = accounts.map((acc) => ({
    id: acc.id, label: acc.name,
    bgColor: ACCOUNT_AVATAR[acc.type]?.bg ?? "#334155",
    Icon: ACCOUNT_AVATAR[acc.type]?.Icon,
  }));

  const categoryItems: PickerItem[] = filteredCategories.map((cat: Category) => ({
    id: cat.id, label: cat.name, bgColor: cat.color,
  }));

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (editTx) {
      await updateTransaction({
        ...editTx, type,
        amount: parseFloat(amount).toString(),
        note: note.trim(), accountId: selectedAccountId, categoryId,
        isRecurring: type === "Expense" ? isRecurring : false,
      });
      showToast("Transaction updated");
    } else {
      await addTransaction(
        {
          type, amount: parseFloat(amount).toString(),
          note: note.trim(), accountId: selectedAccountId, categoryId,
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
          const cfg    = typeConfig[t];
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => { setType(t); setCategoryId(null); }}
              style={[fStyles.typeChip, { borderColor: cfg.color }, active && { backgroundColor: cfg.color }]}
            >
              <Text style={[fStyles.typeChipText, { color: active ? "#fff" : cfg.color }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount */}
      <Text style={[fStyles.label, { color: subText }]}>Amount (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00" placeholderTextColor={subText}
        keyboardType="decimal-pad" value={amount} onChangeText={setAmount}
      />

      {/* Note */}
      <Text style={[fStyles.label, { color: subText }]}>Note</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="What's this for?" placeholderTextColor={subText}
        value={note} onChangeText={setNote}
      />

      {/* Account picker trigger */}
      <Text style={[fStyles.label, { color: subText }]}>Account</Text>
      <TouchableOpacity
        style={[fStyles.pickerTrigger, { backgroundColor: inputBg, borderColor: border }]}
        onPress={() => setShowAccountPicker(true)}
        activeOpacity={0.75}
      >
        {selectedAccount ? (
          <View style={[fStyles.triggerIcon, { backgroundColor: ACCOUNT_AVATAR[selectedAccount.type]?.bg ?? "#334155" }]}>
            {React.createElement(ACCOUNT_AVATAR[selectedAccount.type]?.Icon ?? Wallet, { size: 16, color: "#fff", strokeWidth: 1.8 })}
          </View>
        ) : (
          <View style={[fStyles.triggerIconEmpty, { backgroundColor: border }]} />
        )}
        <Text style={[fStyles.triggerLabel, { color: selectedAccount ? textColor : subText }]} numberOfLines={1}>
          {selectedAccount?.name ?? "Select Account"}
        </Text>
        <ChevronRight size={16} color={subText} />
      </TouchableOpacity>

      {/* Category picker trigger */}
      {filteredCategories.length > 0 && (
        <>
          <Text style={[fStyles.label, { color: subText }]}>Category</Text>
          <TouchableOpacity
            style={[fStyles.pickerTrigger, { backgroundColor: inputBg, borderColor: border }]}
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.75}
          >
            {selectedCategory ? (
              <View style={[fStyles.triggerIcon, { backgroundColor: selectedCategory.color }]}>
                <Text style={fStyles.triggerIconLetter}>{selectedCategory.name[0]?.toUpperCase()}</Text>
              </View>
            ) : (
              <View style={[fStyles.triggerIconEmpty, { backgroundColor: border }]} />
            )}
            <Text style={[fStyles.triggerLabel, { color: selectedCategory ? textColor : subText }]} numberOfLines={1}>
              {selectedCategory?.name ?? "Select Category"}
            </Text>
            <ChevronRight size={16} color={subText} />
          </TouchableOpacity>
        </>
      )}

      {/* Skip balance (add only) */}
      {!editTx && (
        <View style={[fStyles.switchRow, { borderColor: border }]}>
          <Text style={[fStyles.switchLabel, { color: textColor }]}>Skip balance update</Text>
          <Switch value={skipBalance} onValueChange={setSkipBalance} trackColor={{ false: border, true: "#34d399" }} thumbColor="#fff" />
        </View>
      )}

      {/* Recurring (Expense only) */}
      {type === "Expense" && (
        <View style={[fStyles.switchRow, { borderColor: border }]}>
          <Text style={[fStyles.switchLabel, { color: textColor }]}>Monthly recurring</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: border, true: "#34d399" }} thumbColor="#fff" />
        </View>
      )}

      {/* Save */}
      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>{editTx ? "Update Transaction" : "Save Transaction"}</Text>
      </TouchableOpacity>

      {/* Modals */}
      <ItemPickerModal
        visible={showAccountPicker} title="Select Account"
        items={accountItems} selectedId={selectedAccountId}
        onSelect={setSelectedAccountId} onClose={() => setShowAccountPicker(false)} isDark={isDark}
      />
      <ItemPickerModal
        visible={showCategoryPicker} title="Select Category"
        items={categoryItems} selectedId={categoryId}
        onSelect={setCategoryId} onClose={() => setShowCategoryPicker(false)} isDark={isDark}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 22 },
  title: { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, alignItems: "center" },
  typeChipText: { fontSize: 13, fontFamily: F.semi },
  label: { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: F.body, marginBottom: 4,
  },
  pickerTrigger: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 12,
    marginBottom: 4, gap: 10,
  },
  triggerIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  triggerIconEmpty: { width: 34, height: 34, borderRadius: 17 },
  triggerIconLetter: { color: "#fff", fontSize: 14, fontFamily: F.semi },
  triggerLabel: { flex: 1, fontSize: 14, fontFamily: F.semi },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 2,
  },
  switchLabel: { fontSize: 14, fontFamily: F.body },
  saveBtn: { marginTop: 18, backgroundColor: "#34d399", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
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
  const { accounts, categories, transactions, deleteTransaction, config } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

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
              colors={isDark ? ["#4f46e5", "#1e1b4b"] : ["#4f46e5", "#1e293b"]}
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
              <View style={[styles.summaryCard, { backgroundColor: isDark ? "#1e1b4b" : "#ffffff" }]}>
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

            <AnalysisCard
              transactions={transactions}
              categories={categories}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              earned={earned}
              spent={spent}
              isDark={isDark}
            />

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
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
    minHeight: 260,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: F.heading,
    color: "#f1f5f9",
    marginBottom: 18,
    letterSpacing: -0.5,
  },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 18,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
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
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  summaryItemLabel: { fontSize: 11, fontFamily: F.body },
  summaryItemValue: { fontSize: 14, fontFamily: F.semi },
  vertDivider: { width: 1, height: 36, marginHorizontal: 10 },

  // Filter chips
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 13, fontFamily: F.semi },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontFamily: F.semi,
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },

  // Card
  cardWrapper: { paddingHorizontal: 20 },

  // Empty
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 8,
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
