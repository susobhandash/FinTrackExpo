import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect as SvgRect, Text as SvgText, Circle, G } from "react-native-svg";
import { Plus, X, AlertTriangle, Pencil } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { useToast } from "@/context/ToastContext";
import { F } from "@/utils/fonts";
import type { Transaction, Category, Budget } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get("window").width;
// Card has marginHorizontal:20 + padding:18 each side → content width:
const CARD_CHART_W = SCREEN_W - 40 - 36;

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type Period = "Week" | "Month" | "Year";

function filterByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  const now = new Date();
  return transactions.filter((tx) => {
    const d = new Date(tx.date);
    if (period === "Week") {
      const daysFromMon = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysFromMon);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return d >= weekStart && d <= weekEnd;
    }
    if (period === "Month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return d.getFullYear() === now.getFullYear();
  });
}

// ── Period Trend Chart ────────────────────────────────────────────────────────

const TREND_H       = 100;
const TREND_LABEL_H = 18;

interface TrendSlot {
  key: string;
  label: string;
  isActive: boolean;
  income: number;
  expense: number;
}

function getPeriodSlots(transactions: Transaction[], period: Period): TrendSlot[] {
  const now = new Date();

  if (period === "Week") {
    const daysFromMon = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMon);
    weekStart.setHours(0, 0, 0, 0);
    const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    return DAY_LABELS.map((label, i) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const isActive = dayStart.toDateString() === now.toDateString();
      let income = 0, expense = 0;
      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        if (d >= dayStart && d <= dayEnd) {
          if (tx.type === "Income")  income  += parseFloat(tx.amount) || 0;
          if (tx.type === "Expense") expense += parseFloat(tx.amount) || 0;
        }
      });
      return { key: `d${i}`, label, isActive, income, expense };
    });
  }

  if (period === "Month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const slots: TrendSlot[] = [];
    let wn = 1;
    for (let startDay = 1; startDay <= daysInMonth; startDay += 7) {
      const endDay = Math.min(startDay + 6, daysInMonth);
      const wStart = new Date(year, month, startDay, 0, 0, 0, 0);
      const wEnd   = new Date(year, month, endDay, 23, 59, 59, 999);
      const isActive = now >= wStart && now <= wEnd;
      let income = 0, expense = 0;
      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        if (d >= wStart && d <= wEnd) {
          if (tx.type === "Income")  income  += parseFloat(tx.amount) || 0;
          if (tx.type === "Expense") expense += parseFloat(tx.amount) || 0;
        }
      });
      slots.push({ key: `w${wn}`, label: `W${wn}`, isActive, income, expense });
      wn++;
    }
    return slots;
  }

  // Year — all 12 months
  const year = now.getFullYear();
  return MONTHS_SHORT.map((label, i) => {
    const mStart = new Date(year, i, 1, 0, 0, 0, 0);
    const mEnd   = new Date(year, i + 1, 0, 23, 59, 59, 999);
    const isActive = i === now.getMonth();
    let income = 0, expense = 0;
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d >= mStart && d <= mEnd) {
        if (tx.type === "Income")  income  += parseFloat(tx.amount) || 0;
        if (tx.type === "Expense") expense += parseFloat(tx.amount) || 0;
      }
    });
    return { key: `m${i}`, label, isActive, income, expense };
  });
}

interface PeriodTrendChartProps {
  transactions: Transaction[];
  period: Period;
  isDark: boolean;
}

function PeriodTrendChart({ transactions, period, isDark }: PeriodTrendChartProps) {
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";

  const slots = useMemo(
    () => getPeriodSlots(transactions, period),
    [transactions, period],
  );

  const n      = slots.length;
  const groupW = CARD_CHART_W / n;
  const barW   = Math.max(Math.floor(groupW * 0.28), 5);
  const barGap = Math.max(Math.floor(groupW * 0.08), 2);
  const pairW  = barW * 2 + barGap;
  const maxVal = Math.max(...slots.flatMap((s) => [s.income, s.expense]), 1);

  return (
    <View>
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: "#34d399" }]} />
          <Text style={[chartStyles.legendLabel, { color: subText }]}>Income</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: "#f87171" }]} />
          <Text style={[chartStyles.legendLabel, { color: subText }]}>Expense</Text>
        </View>
      </View>
      <Svg width={CARD_CHART_W} height={TREND_H + TREND_LABEL_H}>
        {slots.map((slot, i) => {
          const incH    = slot.income  > 0 ? Math.max((slot.income  / maxVal) * TREND_H, 2) : 0;
          const expH    = slot.expense > 0 ? Math.max((slot.expense / maxVal) * TREND_H, 2) : 0;
          const groupX  = i * groupW + (groupW - pairW) / 2;
          const opacity = slot.isActive ? 1 : 0.45;
          const fs      = period === "Year" ? 9 : 10;
          return (
            <React.Fragment key={slot.key}>
              <SvgRect x={groupX}           y={TREND_H - incH} width={barW} height={incH} rx={3} fill="#34d399" opacity={opacity} />
              <SvgRect x={groupX + barW + barGap} y={TREND_H - expH} width={barW} height={expH} rx={3} fill="#f87171" opacity={opacity} />
              <SvgText
                x={i * groupW + groupW / 2}
                y={TREND_H + TREND_LABEL_H - 2}
                textAnchor="middle"
                fontSize={fs}
                fill={slot.isActive ? textColor : subText}
                fontFamily={F.semi}
              >
                {slot.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  legend:     { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendLabel:{ fontSize: 12, fontFamily: F.body },
});

// ── Flip Chart Card ───────────────────────────────────────────────────────────

interface FlipChartCardProps {
  transactions: Transaction[];
  period: Period;
  income: number;
  expense: number;
  isDark: boolean;
  cardBg: string;
  border: string;
  textColor: string;
  currencySymbol: string;
}

function FlipChartCard({ transactions, period, income, expense, isDark, cardBg, border, textColor, currencySymbol }: FlipChartCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const cardTitle = period === "Week" ? "This Week" : period === "Month" ? "This Month" : "This Year";

  return (
    <TouchableOpacity onPress={handleFlip} activeOpacity={1} style={flipStyles.container}>
      {/* Front — Bar Chart */}
      <Animated.View
        style={[
          styles.card,
          flipStyles.face,
          { backgroundColor: cardBg, borderColor: border, opacity: frontOpacity, transform: [{ rotateY: frontRotate }] },
        ]}
      >
        <View style={flipStyles.titleRow}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>{cardTitle} — Day by Day</Text>
          <Text style={[flipStyles.hint, { color: isDark ? "#475569" : "#94a3b8" }]}>Tap to flip</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <PeriodTrendChart transactions={transactions} period={period} isDark={isDark} />
        </View>
      </Animated.View>

      {/* Back — Donut */}
      <Animated.View
        style={[
          styles.card,
          flipStyles.face,
          flipStyles.back,
          { backgroundColor: cardBg, borderColor: border, opacity: backOpacity, transform: [{ rotateY: backRotate }] },
        ]}
      >
        <View style={flipStyles.titleRow}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>Period Breakdown</Text>
          <Text style={[flipStyles.hint, { color: isDark ? "#475569" : "#94a3b8" }]}>Tap to flip</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <PeriodDonut income={income} expense={expense} isDark={isDark} currencySymbol={currencySymbol} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const flipStyles = StyleSheet.create({
  container: { marginHorizontal: 20, marginTop: 16 },
  face:      { marginHorizontal: 0, marginTop: 0, backfaceVisibility: "hidden" },
  back:      { position: "absolute", top: 0, left: 0, right: 0 },
  titleRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hint:      { fontSize: 11, fontFamily: "System" },
});

// ── Period Donut ──────────────────────────────────────────────────────────────

const PIE_SIZE = 160;
const PIE_R    = 58;
const PIE_SW   = 20;
const PIE_CIRC = 2 * Math.PI * PIE_R;

interface PeriodDonutProps { income: number; expense: number; isDark: boolean; currencySymbol: string; }

function PeriodDonut({ income, expense, isDark, currencySymbol }: PeriodDonutProps) {
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const total = income + expense;
  const net   = income - expense;
  const incDash = total > 0 ? (income  / total) * PIE_CIRC : 0;
  const expDash = total > 0 ? (expense / total) * PIE_CIRC : 0;

  return (
    <View style={donutStyles.row}>
      <View style={donutStyles.svgWrap}>
        <Svg width={PIE_SIZE} height={PIE_SIZE}>
          <G rotation="-90" origin={`${PIE_SIZE / 2},${PIE_SIZE / 2}`}>
            {total > 0 ? (
              <>
                <Circle cx={PIE_SIZE/2} cy={PIE_SIZE/2} r={PIE_R} fill="none" stroke="#34d399" strokeWidth={PIE_SW} strokeDasharray={`${incDash} ${PIE_CIRC - incDash}`} strokeDashoffset={0} />
                <Circle cx={PIE_SIZE/2} cy={PIE_SIZE/2} r={PIE_R} fill="none" stroke="#f87171" strokeWidth={PIE_SW} strokeDasharray={`${expDash} ${PIE_CIRC - expDash}`} strokeDashoffset={-incDash} />
              </>
            ) : (
              <Circle cx={PIE_SIZE/2} cy={PIE_SIZE/2} r={PIE_R} fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth={PIE_SW} />
            )}
          </G>
        </Svg>
        <View style={donutStyles.centerText}>
          <Text style={[donutStyles.netLabel,  { color: subText }]}>Net</Text>
          <Text style={[donutStyles.netAmount, { color: net >= 0 ? "#34d399" : "#f87171" }]}>{currencySymbol}{fmt(Math.abs(net))}</Text>
        </View>
      </View>
      <View style={donutStyles.legend}>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: "#34d399" }]} />
          <View>
            <Text style={[donutStyles.legendType, { color: subText }]}>Income</Text>
            <Text style={[donutStyles.legendAmt,  { color: "#34d399" }]}>{currencySymbol}{fmt(income)}</Text>
          </View>
        </View>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: "#f87171" }]} />
          <View>
            <Text style={[donutStyles.legendType, { color: subText }]}>Expense</Text>
            <Text style={[donutStyles.legendAmt,  { color: "#f87171" }]}>{currencySymbol}{fmt(expense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 16 },
  svgWrap:   { position: "relative", justifyContent: "center", alignItems: "center" },
  centerText:{ position: "absolute", alignItems: "center" },
  netLabel:  { fontSize: 11, fontFamily: F.body },
  netAmount: { fontSize: 14, fontFamily: F.semi },
  legend:    { flex: 1, gap: 12 },
  legendItem:{ flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendType:{ fontSize: 11, fontFamily: F.body, marginBottom: 2 },
  legendAmt: { fontSize: 15, fontFamily: F.semi },
});

// ── Income vs Expense Comparison ──────────────────────────────────────────────

interface IncomeExpenseProps {
  income: number;
  expense: number;
  period: Period;
  isDark: boolean;
  currencySymbol: string;
}

function IncomeExpenseComparison({ income, expense, period, isDark, currencySymbol }: IncomeExpenseProps) {
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border  = isDark ? "#2d2b5e" : "#e2e8f0";
  const max     = Math.max(income, expense, 1);
  const net     = income - expense;

  return (
    <View>
      <View style={icStyles.row}>
        <Text style={[icStyles.label, { color: subText }]}>Income</Text>
        <Text style={[icStyles.amount, { color: "#34d399" }]}>{currencySymbol}{fmt(income)}</Text>
      </View>
      <View style={[icStyles.track, { backgroundColor: border }]}>
        <View style={[icStyles.fill, { width: `${(income / max) * 100}%` as any, backgroundColor: "#34d399" }]} />
      </View>

      <View style={[icStyles.row, { marginTop: 10 }]}>
        <Text style={[icStyles.label, { color: subText }]}>Expense</Text>
        <Text style={[icStyles.amount, { color: "#f87171" }]}>{currencySymbol}{fmt(expense)}</Text>
      </View>
      <View style={[icStyles.track, { backgroundColor: border }]}>
        <View style={[icStyles.fill, { width: `${(expense / max) * 100}%` as any, backgroundColor: "#f87171" }]} />
      </View>

      <View style={[icStyles.netRow, { borderTopColor: border }]}>
        <Text style={[icStyles.netLabel, { color: subText }]}>Net this {period.toLowerCase()}</Text>
        <Text style={[icStyles.netAmt, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
          {net >= 0 ? "+" : "−"}{currencySymbol}{fmt(Math.abs(net))}
        </Text>
      </View>
    </View>
  );
}

const icStyles = StyleSheet.create({
  row:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  label:    { fontSize: 13, fontFamily: F.semi },
  amount:   { fontSize: 14, fontFamily: F.semi },
  track:    { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 2 },
  fill:     { height: 8, borderRadius: 4 },
  netRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  netLabel: { fontSize: 12, fontFamily: F.body },
  netAmt:   { fontSize: 16, fontFamily: F.semi },
});

// ── Budget: Set Form ──────────────────────────────────────────────────────────

interface SetBudgetFormProps { onClose: () => void; isDark: boolean; }

function SetBudgetForm({ onClose, isDark }: SetBudgetFormProps) {
  const { categories, addBudget, config } = useApp();
  const { showToast } = useToast();
  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";
  const cs = config.currencySymbol ?? "₹";

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "Expense"), [categories]);
  const thisMonth = getMonthKey(new Date());

  const handleSave = async () => {
    if (!selectedCatId) { showToast("Select a category", "error"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    await addBudget({ categoryId: selectedCatId, amount: amt.toString(), month: thisMonth });
    showToast("Budget set");
    onClose();
  };

  return (
    <View style={[bfStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[bfStyles.title, { color: textColor }]}>Set Category Budget</Text>
      <Text style={[bfStyles.label, { color: subText }]}>Category</Text>
      <View style={bfStyles.catGrid}>
        {expenseCategories.map((cat) => {
          const active = selectedCatId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCatId(cat.id)}
              style={[bfStyles.catChip, { borderColor: cat.color, backgroundColor: active ? cat.color : `${cat.color}18` }]}
            >
              <View style={[bfStyles.catChipDot, { backgroundColor: active ? "#fff" : cat.color }]} />
              <Text style={[bfStyles.catChipText, { color: active ? "#fff" : cat.color }]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[bfStyles.label, { color: subText }]}>Budget Amount ({cs})</Text>
      <TextInput
        style={[bfStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00" placeholderTextColor={subText}
        keyboardType="decimal-pad" value={amount} onChangeText={setAmount}
      />
      <TouchableOpacity style={bfStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={bfStyles.saveBtnText}>Save Budget</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Budget: Edit Form ─────────────────────────────────────────────────────────

interface EditBudgetFormProps {
  budget: Budget; categoryName: string; categoryColor: string;
  onClose: () => void; isDark: boolean;
}

function EditBudgetForm({ budget, categoryName, categoryColor, onClose, isDark }: EditBudgetFormProps) {
  const { addBudget, deleteBudget, config } = useApp();
  const { showToast } = useToast();
  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";
  const cs = config.currencySymbol ?? "₹";

  const [amount, setAmount] = useState(budget.amount);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    await deleteBudget(budget.id);
    await addBudget({ categoryId: budget.categoryId, amount: amt.toString(), month: budget.month });
    showToast("Budget updated");
    onClose();
  };

  return (
    <View style={[bfStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[bfStyles.title, { color: textColor }]}>Edit Budget</Text>
      <View style={[bfStyles.catPreview, { backgroundColor: `${categoryColor}18`, borderColor: categoryColor }]}>
        <View style={[bfStyles.catChipDot, { backgroundColor: categoryColor }]} />
        <Text style={[bfStyles.catPreviewText, { color: categoryColor }]}>{categoryName}</Text>
      </View>
      <Text style={[bfStyles.label, { color: subText }]}>Budget Amount ({cs})</Text>
      <TextInput
        style={[bfStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00" placeholderTextColor={subText}
        keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus
      />
      <TouchableOpacity style={bfStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={bfStyles.saveBtnText}>Update Budget</Text>
      </TouchableOpacity>
    </View>
  );
}

const bfStyles = StyleSheet.create({
  container:      { padding: 20, borderRadius: 22 },
  title:          { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  label:          { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 8 },
  input:          { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: F.body, marginBottom: 4 },
  catGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  catChip:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1.5 },
  catChipDot:     { width: 6, height: 6, borderRadius: 3 },
  catChipText:    { fontSize: 13, fontFamily: F.semi },
  catPreview:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, marginBottom: 4, marginTop: 8 },
  catPreviewText: { fontSize: 14, fontFamily: F.semi },
  saveBtn:        { marginTop: 20, backgroundColor: "#34d399", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnText:    { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { transactions, categories, budgets, config, addBudget, deleteBudget } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark    = config.theme === "dark";
  const bg        = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";

  const cs = config.currencySymbol ?? "₹";

  const [period, setPeriod] = useState<Period>("Month");

  const now        = new Date();
  const thisMonth  = getMonthKey(now);
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const PERIODS: Period[] = ["Week", "Month", "Year"];

  // ── Insights computations ──────────────────────────────────────────────────

  const periodTx = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);

  const { income, expense, net } = useMemo(() => {
    let inc = 0, exp = 0;
    periodTx.forEach((tx) => {
      if (tx.type === "Income")  inc += parseFloat(tx.amount) || 0;
      if (tx.type === "Expense") exp += parseFloat(tx.amount) || 0;
    });
    return { income: inc, expense: exp, net: inc - exp };
  }, [periodTx]);

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.forEach((tx) => {
      if (tx.type !== "Expense" || !tx.categoryId) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + (parseFloat(tx.amount) || 0);
    });
    return Object.entries(map)
      .map(([catId, amount]) => ({ catId, amount, cat: categories.find((c) => c.id === catId) }))
      .filter((e) => e.cat)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodTx, categories]);

  // ── Budget computations ────────────────────────────────────────────────────

  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === thisMonth), [budgets, thisMonth]);

  const spendMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== "Expense") return;
      const key = getMonthKey(new Date(tx.date));
      if (key !== thisMonth || !tx.categoryId) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + (parseFloat(tx.amount) || 0);
    });
    return map;
  }, [transactions, thisMonth]);

  const enrichedBudgets = useMemo(() => {
    return monthBudgets
      .map((b) => {
        const cat   = categories.find((c) => c.id === b.categoryId);
        const total = parseFloat(b.amount) || 0;
        const spent = spendMap[b.categoryId] || 0;
        const pct   = total > 0 ? (spent / total) * 100 : 0;
        return { ...b, cat, total, spent, pct, isOver: spent > total };
      })
      .filter((b) => b.cat)
      .sort((a, b) => b.pct - a.pct);
  }, [monthBudgets, categories, spendMap]);

  const totalBudget = useMemo(() => enrichedBudgets.reduce((s, b) => s + b.total, 0), [enrichedBudgets]);
  const totalSpent  = useMemo(() => enrichedBudgets.reduce((s, b) => s + b.spent, 0), [enrichedBudgets]);
  const overallPct  = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining   = totalBudget - totalSpent;

  // ── Sheet openers ──────────────────────────────────────────────────────────

  const openSetBudgetSheet = () =>
    openSheet({ isDark, children: <SetBudgetForm onClose={closeSheet} isDark={isDark} /> });

  const openEditBudgetSheet = (b: typeof enrichedBudgets[0]) => {
    if (!b.cat) return;
    openSheet({
      isDark,
      children: <EditBudgetForm budget={b} categoryName={b.cat.name} categoryColor={b.cat.color} onClose={closeSheet} isDark={isDark} />,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero ── */}
        <LinearGradient
          colors={isDark ? ["#6d28d9", "#1e1b4b"] : ["#7c3aed", "#1e293b"]}
          style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>Insights</Text>

          <View style={styles.periodPill}>
            {PERIODS.map((p) => {
              const active = period === p;
              return (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)}
                  style={[styles.periodPillItem, active && styles.periodPillActive]}
                >
                  <Text style={[styles.periodPillText, { color: active ? "#0f172a" : "rgba(255,255,255,0.7)" }]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.summaryCard, { backgroundColor: isDark ? "#1e1b4b" : "#ffffff" }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Net</Text>
              <Text style={[styles.summaryValue, { color: net >= 0 ? "#34d399" : "#f87171" }]}>{cs}{fmt(Math.abs(net))}</Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: "#34d399" }]}>{cs}{fmt(income)}</Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Spent</Text>
              <Text style={[styles.summaryValue, { color: "#f87171" }]}>{cs}{fmt(expense)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Flip Chart Card (Bar ↔ Donut) ── */}
        <FlipChartCard
          transactions={transactions}
          period={period}
          income={income}
          expense={expense}
          isDark={isDark}
          cardBg={cardBg}
          border={border}
          textColor={textColor}
          currencySymbol={cs}
        />

        {/* ── Top Categories ── */}
        {categorySpend.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Top Categories</Text>
            {categorySpend.map(({ catId, amount, cat }) => {
              if (!cat) return null;
              const pct = expense > 0 ? (amount / expense) * 100 : 0;
              return (
                <View key={catId} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catName, { color: textColor }]}>{cat.name}</Text>
                    </View>
                    <View style={styles.catRight}>
                      <Text style={[styles.catAmount, { color: textColor }]}>{cs}{fmt(amount)}</Text>
                      <Text style={[styles.catPct, { color: subText }]}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: border }]}>
                    <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: cat.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Income vs Expense Comparison ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Income vs Expense</Text>
          <IncomeExpenseComparison income={income} expense={expense} period={period} isDark={isDark} currencySymbol={cs} />
        </View>

        {/* ══ Budget Section ══ */}
        <View style={[styles.budgetDivider, { borderTopColor: border }]}>
          <View style={styles.budgetDividerLeft}>
            <View style={styles.budgetDividerDot} />
            <Text style={[styles.budgetDividerLabel, { color: textColor }]}>Budget · {monthLabel}</Text>
          </View>
          <TouchableOpacity onPress={openSetBudgetSheet} hitSlop={8}>
            <Text style={styles.addLink}>+ Set Budget</Text>
          </TouchableOpacity>
        </View>

        {/* Budget overview card */}
        {totalBudget > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.budgetOverviewTop}>
              <View>
                <Text style={[styles.budgetOverviewLabel, { color: subText }]}>Monthly Budget</Text>
                <Text style={[styles.budgetOverviewTotal, { color: textColor }]}>{cs}{fmt(totalBudget)}</Text>
              </View>
              <View style={[styles.pctBadge, { backgroundColor: overallPct > 100 ? "#f8717120" : "#34d39920" }]}>
                <Text style={[styles.pctBadgeText, { color: overallPct > 100 ? "#f87171" : "#34d399" }]}>{overallPct.toFixed(0)}%</Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: border, marginVertical: 10 }]}>
              <View style={[styles.progressFill, { width: `${Math.min(overallPct, 100)}%` as any, backgroundColor: overallPct > 100 ? "#f87171" : "#34d399" }]} />
            </View>
            <Text style={[styles.remainingText, { color: subText }]}>
              {remaining >= 0 ? `${cs}${fmt(remaining)} remaining` : `Over by ${cs}${fmt(Math.abs(remaining))}`}
            </Text>
          </View>
        )}

        {/* Category budgets */}
        {enrichedBudgets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.emptyText, { color: subText }]}>No budgets set for this month</Text>
          </View>
        ) : (
          enrichedBudgets.map((item) => {
            if (!item.cat) return null;
            const barColor = item.isOver ? "#f87171" : item.cat.color;
            return (
              <View key={item.id} style={[styles.budgetCard, { backgroundColor: cardBg, borderColor: border }]}>
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
                    <Text style={[styles.spentPct, { color: item.isOver ? "#f87171" : textColor }]}>{item.pct.toFixed(0)}%</Text>
                    <TouchableOpacity onPress={() => openEditBudgetSheet(item)} hitSlop={8}>
                      <Pencil size={15} color={subText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteBudget(item.id)} hitSlop={8}>
                      <X size={16} color={subText} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.spentLabel, { color: subText }]}>{cs}{fmt(item.spent)} of {cs}{fmt(item.total)}</Text>
                <View style={[styles.progressTrack, { backgroundColor: border, marginVertical: 8 }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(item.pct, 100)}%` as any, backgroundColor: barColor }]} />
                </View>
                {item.isOver && <Text style={styles.overText}>Over by {cs}{fmt(item.spent - item.total)}</Text>}
              </View>
            );
          })
        )}

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
  root:          { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  hero: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 28, minHeight: 220 },
  heroTitle: { fontSize: 28, fontFamily: F.heading, color: "#f1f5f9", marginBottom: 12 },

  periodPill:       { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 4, marginBottom: 16 },
  periodPillItem:   { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodPillActive: { backgroundColor: "#f1f5f9" },
  periodPillText:   { fontSize: 13, fontFamily: F.semi },

  summaryCard:  { borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  summaryItem:  { flex: 1, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 11, fontFamily: F.body },
  summaryValue: { fontSize: 14, fontFamily: F.semi },
  vertDivider:  { width: 1, height: 36, marginHorizontal: 8 },

  card:      { marginHorizontal: 20, marginTop: 16, borderRadius: 22, padding: 18, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontFamily: F.title, marginBottom: 14 },

  catRow:    { marginBottom: 12 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  catDot:    { width: 8, height: 8, borderRadius: 4 },
  catName:   { fontSize: 13, fontFamily: F.semi },
  catRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  catAmount: { fontSize: 13, fontFamily: F.semi },
  catPct:    { fontSize: 11, fontFamily: F.body, minWidth: 36, textAlign: "right" },

  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: 6, borderRadius: 3 },

  // Budget section divider
  budgetDivider: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: 20, marginTop: 28, paddingTop: 20, borderTopWidth: 1,
  },
  budgetDividerLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetDividerDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: "#f59e0b" },
  budgetDividerLabel: { fontSize: 16, fontFamily: F.title },
  addLink:            { fontSize: 13, fontFamily: F.semi, color: "#34d399" },

  // Budget overview
  budgetOverviewTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  budgetOverviewLabel: { fontSize: 12, fontFamily: F.body, marginBottom: 4 },
  budgetOverviewTotal: { fontSize: 26, fontFamily: F.heading },
  pctBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pctBadgeText: { fontSize: 14, fontFamily: F.semi },
  remainingText:{ fontSize: 12, fontFamily: F.body },

  // Budget cards
  budgetCard:       { marginHorizontal: 20, marginTop: 12, borderRadius: 22, padding: 16, borderWidth: 1 },
  budgetCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  budgetCardLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetCardRight:  { flexDirection: "row", alignItems: "center", gap: 10 },
  spentPct:    { fontSize: 13, fontFamily: F.semi },
  spentLabel:  { fontSize: 12, fontFamily: F.body },
  overBadge:   { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f8717120", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  overBadgeText:{ fontSize: 10, fontFamily: F.semi, color: "#f87171" },
  overText:    { fontSize: 12, fontFamily: F.semi, color: "#f87171" },

  emptyCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 22, padding: 28, borderWidth: 1, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: F.body },

  fab: {
    position: "absolute", bottom: 110, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#34d399",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#34d399", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
