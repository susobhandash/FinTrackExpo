import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect as SvgRect, Text as SvgText, Path as SvgPath, Line as SvgLine } from "react-native-svg";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Plus,
  ChevronLeft,
  Check,
  Landmark,
  Wallet,
  Banknote,
  CreditCard,
} from "lucide-react-native";
import { router } from "expo-router";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import type { Transaction, Category } from "@/types";
import SwipeableCardStack from "@/components/SwipeableCardStack";
import { hapticSuccess, hapticError, hapticLight, hapticSelection } from "@/utils/haptics";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ── Account avatar helpers ────────────────────────────────────────────────────

const ACCOUNT_AVATAR_CFG: Record<string, { bg: string; Icon: React.ComponentType<any> }> = {
  Bank:   { bg: "#0c4a6e", Icon: Landmark },
  Cash:   { bg: "#064e3b", Icon: Banknote },
  Wallet: { bg: "#312e81", Icon: Wallet },
  Credit: { bg: "#7f1d1d", Icon: CreditCard },
};

// ── Generic list-picker modal (like the "Select Categories" screen) ────────────

interface PickerItem {
  id: string;
  label: string;
  bgColor: string;
  Icon?: React.ComponentType<any>;
}

function ItemPickerModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  isDark,
}: {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const bg      = isDark ? "#1e1b4b" : "#ffffff";
  const pageBg  = isDark ? "#0f0c29" : "#f8fafc";
  const text    = isDark ? "#f1f5f9" : "#1e293b";
  const sub     = isDark ? "#94a3b8" : "#64748b";
  const divider = isDark ? "#2d2b5e" : "#f1f5f9";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        {/* Header */}
        <View style={[pmStyles.header, { backgroundColor: bg, borderBottomColor: divider }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={pmStyles.backBtn}>
            <ChevronLeft size={24} color={text} />
          </TouchableOpacity>
          <Text style={[pmStyles.headerTitle, { color: text }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* List */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
          {items.map((item, idx) => {
            const selected = item.id === selectedId;
            const isLast = idx === items.length - 1;
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  onPress={() => { hapticSelection(); onSelect(item.id); onClose(); }}
                  style={[pmStyles.row, selected && { backgroundColor: `${item.bgColor}18` }]}
                  activeOpacity={0.7}
                >
                  <View style={[pmStyles.iconCircle, { backgroundColor: item.bgColor }]}>
                    {item.Icon ? (
                      <item.Icon size={24} color="#fff" strokeWidth={1.8} />
                    ) : (
                      <Text style={pmStyles.iconLetter}>{item.label[0]?.toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={[pmStyles.rowLabel, { color: text }]}>{item.label}</Text>
                  {selected && <Check size={22} color="#34d399" strokeWidth={2.5} />}
                </TouchableOpacity>
                {!isLast && (
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: F.title },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconLetter: { color: "#fff", fontSize: 22, fontFamily: F.semi },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: F.semi },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
});

// ── Add Transaction Form ──────────────────────────────────────────────────────

interface AddTxFormProps {
  onClose: () => void;
  isDark: boolean;
  initialType?: "Expense" | "Income" | "Transfer";
}

function AddTransactionForm({ onClose, isDark, initialType = "Expense" }: AddTxFormProps) {
  const { accounts, categories, addTransaction, showToast, config } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [note, setNote]     = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType]     = useState<"Expense" | "Income" | "Transfer">(initialType);
  const defaultId = config.defaultAccountId ?? accounts[0]?.id ?? null;
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(defaultId);
  const [skipBalance, setSkipBalance] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [categoryId, setCategoryId]   = useState<string | null>(null);
  const [showAccountPicker, setShowAccountPicker]   = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
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
    id: acc.id,
    label: acc.name,
    bgColor: ACCOUNT_AVATAR_CFG[acc.type]?.bg ?? "#334155",
    Icon: ACCOUNT_AVATAR_CFG[acc.type]?.Icon,
  }));

  const categoryItems: PickerItem[] = filteredCategories.map((cat) => ({
    id: cat.id,
    label: cat.name,
    bgColor: cat.color,
  }));

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      hapticError();
      showToast("Enter a valid amount", "error");
      return;
    }
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
    hapticSuccess();
    showToast("Transaction saved");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Record Transaction</Text>

      {/* Type selector */}
      <View style={fStyles.typeRow}>
        {(["Expense", "Income", "Transfer"] as const).map((t) => {
          const cfg    = typeConfig[t];
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => { hapticSelection(); setType(t); setCategoryId(null); }}
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

      {/* Account picker trigger */}
      <Text style={[fStyles.label, { color: subText }]}>Account</Text>
      <TouchableOpacity
        style={[fStyles.pickerTrigger, { backgroundColor: inputBg, borderColor: border }]}
        onPress={() => setShowAccountPicker(true)}
        activeOpacity={0.75}
      >
        {selectedAccount ? (
          <View style={[fStyles.triggerIcon, { backgroundColor: ACCOUNT_AVATAR_CFG[selectedAccount.type]?.bg ?? "#334155" }]}>
            {React.createElement(ACCOUNT_AVATAR_CFG[selectedAccount.type]?.Icon ?? Wallet, { size: 16, color: "#fff", strokeWidth: 1.8 })}
          </View>
        ) : (
          <View style={[fStyles.triggerIconEmpty, { backgroundColor: border }]} />
        )}
        <Text style={[fStyles.triggerLabel, { color: selectedAccount ? textColor : subText }]} numberOfLines={1}>
          {selectedAccount?.name ?? "Select Account"}
        </Text>
        <ChevronLeft size={16} color={subText} style={{ transform: [{ rotate: "-90deg" }] }} />
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
            <ChevronLeft size={16} color={subText} style={{ transform: [{ rotate: "-90deg" }] }} />
          </TouchableOpacity>
        </>
      )}

      {/* Skip balance */}
      <View style={[fStyles.switchRow, { borderColor: border }]}>
        <Text style={[fStyles.switchLabel, { color: textColor }]}>Skip balance update</Text>
        <Switch value={skipBalance} onValueChange={setSkipBalance} trackColor={{ false: border, true: "#34d399" }} thumbColor="#fff" />
      </View>

      {/* Recurring */}
      {type === "Expense" && (
        <View style={[fStyles.switchRow, { borderColor: border }]}>
          <Text style={[fStyles.switchLabel, { color: textColor }]}>Monthly recurring</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: border, true: "#34d399" }} thumbColor="#fff" />
        </View>
      )}

      {/* Save */}
      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Transaction</Text>
      </TouchableOpacity>

      {/* Pickers */}
      <ItemPickerModal
        visible={showAccountPicker}
        title="Select Account"
        items={accountItems}
        selectedId={selectedAccountId}
        onSelect={setSelectedAccountId}
        onClose={() => setShowAccountPicker(false)}
        isDark={isDark}
      />
      <ItemPickerModal
        visible={showCategoryPicker}
        title="Select Category"
        items={categoryItems}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategoryPicker(false)}
        isDark={isDark}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 16 },
  title: { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
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
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 10,
  },
  triggerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  triggerIconEmpty: { width: 34, height: 34, borderRadius: 17 },
  triggerIconLetter: { color: "#fff", fontSize: 14, fontFamily: F.semi },
  triggerLabel: { flex: 1, fontSize: 14, fontFamily: F.semi },
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

// ── Weekly Chart ──────────────────────────────────────────────────────────────

const _SCREEN_W     = Dimensions.get("window").width;
const CHART_CARD_PAD = 20;
const SECTION_PAD_H  = 20;
const Y_AXIS_W       = 28;
const CHART_H_BAR    = 130;
const CHART_PAD_TOP  = 10;
const DAY_LABEL_H    = 22;
const SVG_H_WEEK     = CHART_PAD_TOP + CHART_H_BAR + DAY_LABEL_H;
const BAR_AREA_W     = _SCREEN_W - SECTION_PAD_H * 2 - CHART_CARD_PAD * 2 - Y_AXIS_W;
const SLOT_W_F       = BAR_AREA_W / 7;
const BAR_W_F        = Math.floor(SLOT_W_F * 0.52);
const WEEK_DAYS      = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STACK_COLORS   = ["#f59e0b", "#8b5cf6", "#e2e8f0"] as const;

function roundedTopPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  const ar = Math.min(r, h / 2, w / 2);
  return `M${x},${y + h} L${x},${y + ar} Q${x},${y} ${x + ar},${y} L${x + w - ar},${y} Q${x + w},${y} ${x + w},${y + ar} L${x + w},${y + h} Z`;
}

interface WeeklyChartProps {
  transactions: Transaction[];
  categories:   Category[];
  isDark:       boolean;
}

function WeeklySpendingChart({ transactions, categories, isDark }: WeeklyChartProps) {
  const [mode, setMode] = useState<"Week" | "Month">("Week");
  const now        = new Date();
  const todayDow   = now.getDay();
  const todayDate  = now.getDate(); // 1-based day of month

  // ── compute slot labels + data ──────────────────────────────────────────────
  const { slotLabels, slotData, maxBarTotal, topCatInfos, highlightIdx } = useMemo(() => {
    if (mode === "Week") {
      // 7 slots: Sun–Sat of the current week
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - todayDow);
      weekStart.setHours(0, 0, 0, 0);

      const grid: Record<number, Record<string, number>> = {};
      for (let i = 0; i < 7; i++) grid[i] = {};

      transactions.forEach((tx) => {
        if (tx.type !== "Expense") return;
        const d = new Date(tx.date);
        if (d < weekStart || d > now) return;
        const dow = d.getDay();
        const catId = tx.categoryId ?? "__none__";
        grid[dow][catId] = (grid[dow][catId] || 0) + (parseFloat(tx.amount) || 0);
      });

      const catTotals: Record<string, number> = {};
      Object.values(grid).forEach((dayMap) =>
        Object.entries(dayMap).forEach(([id, amt]) => {
          catTotals[id] = (catTotals[id] || 0) + amt;
        })
      );
      const topCatIds = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);

      return {
        slotLabels:  WEEK_DAYS,
        slotData:    WEEK_DAYS.map((_, i) => topCatIds.map((id) => grid[i][id] || 0)),
        maxBarTotal: Math.max(...WEEK_DAYS.map((_, i) => topCatIds.reduce((s, id) => s + (grid[i][id] || 0), 0)), 1),
        topCatInfos: topCatIds.map((id, i) => ({ id, name: categories.find((c) => c.id === id)?.name ?? "Other", color: STACK_COLORS[i] })),
        highlightIdx: todayDow,
      };
    } else {
      // Month mode: one slot per day of current month
      const year  = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthStart = new Date(year, month, 1);
      const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const grid: Record<number, Record<string, number>> = {};
      for (let d = 1; d <= daysInMonth; d++) grid[d] = {};

      transactions.forEach((tx) => {
        if (tx.type !== "Expense") return;
        const d = new Date(tx.date);
        if (d < monthStart || d > monthEnd) return;
        const day   = d.getDate();
        const catId = tx.categoryId ?? "__none__";
        grid[day][catId] = (grid[day][catId] || 0) + (parseFloat(tx.amount) || 0);
      });

      const catTotals: Record<string, number> = {};
      Object.values(grid).forEach((dayMap) =>
        Object.entries(dayMap).forEach(([id, amt]) => {
          catTotals[id] = (catTotals[id] || 0) + amt;
        })
      );
      const topCatIds = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);

      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      // Label every 7th day + last day to avoid clutter
      const labels = days.map((d) => (d === 1 || d % 7 === 0 || d === daysInMonth) ? String(d) : "");

      return {
        slotLabels:  labels,
        slotData:    days.map((d) => topCatIds.map((id) => grid[d][id] || 0)),
        maxBarTotal: Math.max(...days.map((d) => topCatIds.reduce((s, id) => s + (grid[d][id] || 0), 0)), 1),
        topCatInfos: topCatIds.map((id, i) => ({ id, name: categories.find((c) => c.id === id)?.name ?? "Other", color: STACK_COLORS[i] })),
        highlightIdx: todayDate - 1, // 0-indexed
      };
    }
  }, [transactions, categories, mode, todayDow, todayDate]);

  const numSlots  = slotLabels.length;
  // Month uses narrower bars
  const slotW     = mode === "Week" ? SLOT_W_F : BAR_AREA_W / numSlots;
  const barW      = mode === "Week" ? BAR_W_F  : Math.max(Math.floor(slotW * 0.6), 3);
  const svgW      = BAR_AREA_W + Y_AXIS_W;

  const ticks = [0.25, 0.5, 0.75, 1.0].map((p) => ({
    value: maxBarTotal * p,
    y: CHART_PAD_TOP + CHART_H_BAR - p * CHART_H_BAR,
  }));

  const yLabel = (v: number) => {
    if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
    if (v >= 1000)   return `${(v / 1000).toFixed(0)}k`;
    return `${Math.round(v)}`;
  };

  const titleColor     = isDark ? "#f1f5f9" : "#1e293b";
  const gridLineColor  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const yLabelColor    = isDark ? "rgba(255,255,255,0.35)" : "#94a3b8";
  const dayLabelColor  = isDark ? "rgba(255,255,255,0.38)" : "#94a3b8";
  const todayLabelClr  = isDark ? "#fff" : "#1e293b";
  const emptyBarColor  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const legendTextClr  = isDark ? "rgba(255,255,255,0.55)" : "#64748b";
  const toggleBgColor  = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)";
  const toggleBdColor  = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const toggleTextClr  = isDark ? "#f1f5f9" : "#1e293b";

  const cardContent = (
    <>
      {/* Header */}
      <View style={weekStyles.header}>
        <Text style={[weekStyles.title, { color: titleColor }]}>
          {mode === "Week" ? "Weekly" : "Monthly"} Spending
        </Text>
        <TouchableOpacity
          onPress={() => { hapticLight(); setMode((m) => m === "Week" ? "Month" : "Week"); }}
          style={[weekStyles.toggleBtn, { backgroundColor: toggleBgColor, borderColor: toggleBdColor }]}
        >
          <Text style={[weekStyles.toggleText, { color: toggleTextClr }]}>{mode} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* SVG chart */}
      <Svg width={svgW} height={SVG_H_WEEK}>
        {/* Grid lines + Y-axis labels */}
        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <SvgLine
              x1={Y_AXIS_W} y1={tick.y}
              x2={svgW} y2={tick.y}
              stroke={gridLineColor}
              strokeWidth={1}
            />
            <SvgText
              x={Y_AXIS_W - 4} y={tick.y + 4}
              textAnchor="end"
              fontSize={9}
              fill={yLabelColor}
              fontFamily={F.body}
            >
              {yLabel(tick.value)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Stacked bars + slot labels */}
        {slotLabels.map((label, idx) => {
          const segs    = slotData[idx];
          const total   = segs.reduce((s: number, v: number) => s + v, 0);
          const bx      = Y_AXIS_W + idx * slotW + (slotW - barW) / 2;
          const isToday = idx === highlightIdx;

          const slotLabel = label ? (
            <SvgText
              key={`lbl-${idx}`}
              x={bx + barW / 2} y={SVG_H_WEEK - 4}
              textAnchor="middle"
              fontSize={mode === "Month" ? 8 : 10}
              fill={isToday ? todayLabelClr : dayLabelColor}
              fontFamily={F.semi}
            >
              {label}
            </SvgText>
          ) : null;

          if (total === 0) {
            return (
              <React.Fragment key={`slot-${idx}`}>
                <SvgPath
                  d={roundedTopPath(bx, CHART_PAD_TOP + CHART_H_BAR - 6, barW, 6, 2)}
                  fill={emptyBarColor}
                />
                {slotLabel}
              </React.Fragment>
            );
          }

          // Render bottom→top: index order [2, 1, 0]
          const stackOrder = [2, 1, 0];
          let cumY = CHART_PAD_TOP + CHART_H_BAR;
          const barParts: React.ReactElement[] = [];
          const topIdx = stackOrder.find((si) => (segs[si] ?? 0) > 0) ?? 0;

          stackOrder.forEach((si) => {
            const v = segs[si] ?? 0;
            if (v <= 0) return;
            const sh  = Math.max((v / maxBarTotal) * CHART_H_BAR, 1);
            const sy  = cumY - sh;
            const clr = STACK_COLORS[si];
            if (si === topIdx) {
              barParts.push(
                <SvgPath key={si} d={roundedTopPath(bx, sy, barW, sh, mode === "Month" ? 2 : 5)} fill={clr} />
              );
            } else {
              barParts.push(
                <SvgRect key={si} x={bx} y={sy} width={barW} height={sh} fill={clr} />
              );
            }
            cumY = sy;
          });

          return (
            <React.Fragment key={`slot-${idx}`}>
              {barParts}
              {slotLabel}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      {topCatInfos.length > 0 && (
        <View style={weekStyles.legend}>
          {topCatInfos.map((info) => (
            <View key={info.id} style={weekStyles.legendItem}>
              <View style={[weekStyles.legendDot, { backgroundColor: info.color }]} />
              <Text style={[weekStyles.legendText, { color: legendTextClr }]} numberOfLines={1}>
                {info.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  if (isDark) {
    return (
      <LinearGradient
        colors={["#1e1b4b", "#110e2e", "#0f0c29"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={weekStyles.card}
      >
        {cardContent}
      </LinearGradient>
    );
  }
  return (
    <View style={[weekStyles.card, weekStyles.cardLight]}>
      {cardContent}
    </View>
  );
}

const weekStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingHorizontal: CHART_CARD_PAD,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: "hidden",
  },
  cardLight: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontFamily: F.title },
  toggleBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  toggleText: { fontSize: 13, fontFamily: F.semi },
  legend:     { flexDirection: "row", gap: 14, marginTop: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: F.body, maxWidth: 80 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { accounts, transactions, categories, investments, config } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark    = config.theme === "dark";
  const bg        = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";

  // ── Computed figures ──────────────────────────────────────────────────────

  const netWorth = useMemo(() => {
    const accountAssets = accounts
      .filter((a) => a.type !== "Credit")
      .reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0);
    const investmentValue = investments.reduce(
      (sum, inv) => sum + parseFloat(inv.currentValue || "0"),
      0
    );
    const creditLiabilities = accounts
      .filter((a) => a.type === "Credit")
      .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance || "0")), 0);
    return accountAssets + investmentValue - creditLiabilities;
  }, [accounts, investments]);

  const thisMonthKey = getMonthKey(new Date());

  const { incomeThisMonth, expenseThisMonth } = useMemo(() => {
    let income  = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      const key = getMonthKey(new Date(tx.date));
      if (key !== thisMonthKey) return;
      if (tx.type === "Income")  income  += parseFloat(tx.amount) || 0;
      if (tx.type === "Expense") expense += parseFloat(tx.amount) || 0;
    });
    return { incomeThisMonth: income, expenseThisMonth: expense };
  }, [transactions, thisMonthKey]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [transactions]
  );

  // Only Bank accounts for home page stack
  const bankAccounts = useMemo(
    () => accounts.filter((a) => a.type === "Bank"),
    [accounts]
  );

  // ── Sheet opener ──────────────────────────────────────────────────────────

  const openAddSheet = (initialType: "Expense" | "Income" | "Transfer" = "Expense") => {
    openSheet({
      isDark,
      children: (
        <AddTransactionForm
          onClose={closeSheet}
          isDark={isDark}
          initialType={initialType}
        />
      ),
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getCategoryById = (id: string | null): Category | undefined =>
    categories.find((c) => c.id === id);

  const getAccountName = (id: string | null): string =>
    accounts.find((a) => a.id === id)?.name ?? "—";

  const txTypeColor = (type: string) =>
    type === "Expense" ? "#ef4444" : type === "Income" ? "#34d399" : "#60a5fa";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={isDark ? ["#1e1b4b", "#0f0c29"] : ["#4f46e5", "#1e293b"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Greeting row */}
          <View style={styles.heroTop}>
            <Text style={styles.greeting}>
              {config.userName ? `Hey, ${config.userName}! 👋` : "Good day"}
            </Text>
            <Text style={styles.heroDate}>{formatDate()}</Text>
          </View>

          {/* Net worth card */}
          <View style={[styles.networthCard, { backgroundColor: isDark ? "#1e1b4b" : "#ffffff" }]}>
            <Text style={[styles.networthLabel, { color: subText }]}>Net Worth</Text>
            <Text style={[styles.networthAmount, { color: textColor }]}>
              ₹{netWorth.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </Text>

            <View style={[styles.divider, { backgroundColor: border }]} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <TrendingUp size={14} color="#34d399" />
                <Text style={[styles.summaryLabel, { color: subText }]}>Income</Text>
                <Text style={[styles.summaryValue, { color: "#34d399" }]}>
                  ₹{incomeThisMonth.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={[styles.vertDivider, { backgroundColor: border }]} />
              <View style={styles.summaryItem}>
                <TrendingDown size={14} color="#f87171" />
                <Text style={[styles.summaryLabel, { color: subText }]}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: "#f87171" }]}>
                  ₹{expenseThisMonth.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.qaBtn, { backgroundColor: "#ef444418" }]}
              onPress={() => { hapticLight(); openAddSheet("Expense"); }}
              activeOpacity={0.8}
            >
              <TrendingDown size={20} color="#ef4444" />
              <Text style={[styles.qaLabel, { color: "#ef4444" }]}>Spend</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qaBtn, { backgroundColor: "#34d39918" }]}
              onPress={() => { hapticLight(); openAddSheet("Income"); }}
              activeOpacity={0.8}
            >
              <TrendingUp size={20} color="#34d399" />
              <Text style={[styles.qaLabel, { color: "#34d399" }]}>Earn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qaBtn, { backgroundColor: "#60a5fa18" }]}
              onPress={() => { hapticLight(); openAddSheet("Transfer"); }}
              activeOpacity={0.8}
            >
              <ArrowLeftRight size={20} color="#60a5fa" />
              <Text style={[styles.qaLabel, { color: "#60a5fa" }]}>Move</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── My Accounts (Bank only) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>My Accounts</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/wealth")} hitSlop={8}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {bankAccounts.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyAccountCard, { borderColor: border }]}
              onPress={() => router.push("/(tabs)/wealth")}
              activeOpacity={0.7}
            >
              <Plus size={22} color={subText} />
              <Text style={[styles.emptyAccountText, { color: subText }]}>
                Add your first bank account
              </Text>
            </TouchableOpacity>
          ) : (
            <SwipeableCardStack
              category="Bank"
              accounts={bankAccounts}
              isDark={isDark}
            />
          )}
        </View>

        {/* ── Weekly Spending Chart ── */}
        {config.showWeeklySpendingChart && (
          <View style={styles.section}>
            <WeeklySpendingChart transactions={transactions} categories={categories} isDark={isDark} />
          </View>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")} hitSlop={8}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.emptyText, { color: subText }]}>No transactions yet</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              {recentTransactions.map((tx, idx) => {
                const cat       = getCategoryById(tx.categoryId);
                const typeColor = txTypeColor(tx.type);
                const isLast    = idx === recentTransactions.length - 1;

                return (
                  <View key={tx.id}>
                    <View style={styles.txRow}>
                      <View style={[styles.txIconBg, { backgroundColor: `${typeColor}18` }]}>
                        <Text style={{ color: typeColor, fontSize: 14, fontFamily: F.semi }}>
                          {tx.type === "Expense" ? "↑" : tx.type === "Income" ? "↓" : "⇄"}
                        </Text>
                      </View>
                      <View style={styles.txMeta}>
                        <Text style={[styles.txNote, { color: textColor }]} numberOfLines={1}>
                          {tx.note || cat?.name || "Transaction"}
                        </Text>
                        <Text style={[styles.txAccount, { color: subText }]}>
                          {getAccountName(tx.accountId)}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, { color: typeColor }]}>
                        {tx.type === "Expense" ? "-" : tx.type === "Income" ? "+" : ""}
                        ₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    {!isLast && (
                      <View style={[styles.txDivider, { backgroundColor: border }]} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { hapticLight(); openAddSheet("Expense"); }}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#0f172a" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 36,
    minHeight: 260,
    justifyContent: "space-between",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 28,
    fontFamily: F.heading,
    color: "#f1f5f9",
    letterSpacing: -0.5,
  },
  heroDate: {
    fontSize: 12,
    fontFamily: F.body,
    color: "rgba(255,255,255,0.6)",
    alignSelf: "flex-start",
  },

  networthCard: {
    borderRadius: 26,
    padding: 22,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  networthLabel: {
    fontSize: 12,
    fontFamily: F.semi,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  networthAmount: { fontSize: 38, fontFamily: F.heading, letterSpacing: -1 },
  divider: { height: 1, marginVertical: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontSize: 12, fontFamily: F.body },
  summaryValue: { fontSize: 14, fontFamily: F.semi, marginLeft: "auto" },
  vertDivider: { width: 1, height: 28, marginHorizontal: 14 },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontFamily: F.title },
  seeAll: { fontSize: 13, fontFamily: F.semi, color: "#34d399" },

  // Quick actions
  quickActions: { flexDirection: "row", gap: 12 },
  qaBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    gap: 8,
  },
  qaLabel: { fontSize: 13, fontFamily: F.semi },

  // Account list
  emptyAccountCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 26,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyAccountText: { fontSize: 14, fontFamily: F.semi },

  // Card
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },

  // Recent tx
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  txIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  txMeta: { flex: 1 },
  txNote: { fontSize: 14, fontFamily: F.semi, marginBottom: 3 },
  txAccount: { fontSize: 12, fontFamily: F.body },
  txAmount: { fontSize: 14, fontFamily: F.semi },
  txDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 4 },
  emptyText: {
    fontSize: 14,
    fontFamily: F.body,
    textAlign: "center",
    paddingVertical: 8,
  },

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
