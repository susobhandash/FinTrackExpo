import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle as SvgCircle, Line } from "react-native-svg";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { F } from "@/utils/fonts";
import type { Transaction, Category } from "@/types";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const CHART_H   = 90;
const CHART_PAD = 10;
const SCREEN_W  = Dimensions.get("window").width;

interface AnalysisCardProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: number;
  selectedYear: number;
  earned: number;
  spent: number;
  isDark: boolean;
  currencySymbol?: string;
}

export default function AnalysisCard({
  transactions,
  categories,
  selectedMonth,
  selectedYear,
  earned,
  spent,
  isDark,
  currencySymbol = "₹",
}: AnalysisCardProps) {
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const chartBg = isDark ? "#0f172a" : "#f8fafc";
  const gridLine = isDark ? "#1e293b" : "#e2e8f0";

  // ── Last 5 months income / expense ────────────────────────────────────────
  const last5 = useMemo(() => {
    const result = [];
    for (let i = 4; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m < 0) {
        m += 12;
        y--;
      }
      const txs = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
      const income = txs
        .filter((t) => t.type === "Income")
        .reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
      const expense = txs
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
      result.push({ label: MONTHS_SHORT[m], income, expense });
    }
    return result;
  }, [transactions, selectedMonth, selectedYear]);

  // ── % change vs previous month ────────────────────────────────────────────
  const prevIncome = last5[3]?.income ?? 0;
  const prevExpense = last5[3]?.expense ?? 0;
  const incomeChange =
    prevIncome === 0 ? null : ((earned - prevIncome) / prevIncome) * 100;
  const expenseChange =
    prevExpense === 0 ? null : ((spent - prevExpense) / prevExpense) * 100;

  // ── Category breakdown (current month expenses) ───────────────────────────
  const breakdown = useMemo(() => {
    const txs = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return (
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth &&
        tx.type === "Expense"
      );
    });
    const map: Record<string, number> = {};
    txs.forEach((tx) => {
      if (tx.categoryId)
        map[tx.categoryId] =
          (map[tx.categoryId] || 0) + parseFloat(tx.amount || "0");
    });
    return Object.entries(map)
      .map(([id, amount]) => ({
        cat: categories.find((c) => c.id === id),
        amount,
      }))
      .filter((x) => x.cat)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) as { cat: Category; amount: number }[];
  }, [transactions, categories, selectedMonth, selectedYear]);

  const totalBreakdown = breakdown.reduce((s, x) => s + x.amount, 0);

  // ── SVG chart ─────────────────────────────────────────────────────────────
  // card margin 20*2, card padding 16*2
  const chartW = SCREEN_W - 40 - 32;
  const innerW = chartW - CHART_PAD * 2;
  const innerH = CHART_H - CHART_PAD * 2;
  const maxVal = Math.max(
    ...last5.map((m) => Math.max(m.income, m.expense)),
    1,
  );

  const toPoint = (val: number, idx: number) => ({
    x: (idx / 4) * innerW + CHART_PAD,
    y: CHART_H - CHART_PAD - (val / maxVal) * innerH,
  });

  const incomePoints = last5.map((m, i) => toPoint(m.income, i));
  const expensePoints = last5.map((m, i) => toPoint(m.expense, i));
  const toPolyline = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <Text style={[styles.title, { color: textColor }]}>Monthly Summary</Text>
      <Text style={[styles.subtitle, { color: subText }]}>
        Here's the detailed summary of your monthly spending analysis:
      </Text>

      {/* ── Stat cards ── */}
      <View style={styles.statsRow}>
        {/* Income */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? "#0f172a" : "#f0fdf4",
              borderColor: "#22c55e22",
            },
          ]}
        >
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: subText }]}>
              Total Income
            </Text>
            <View style={[styles.arrowBadge, { backgroundColor: "#22c55e18" }]}>
              <TrendingUp size={12} color="#22c55e" />
            </View>
          </View>
          <Text
            style={[styles.statAmount, { color: textColor }]}
            numberOfLines={1}
          >
            {currencySymbol}
            {earned.toLocaleString("en-IN")}
          </Text>
          {incomeChange !== null && (
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    incomeChange >= 0 ? "#22c55e22" : "#ef444422",
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  { color: incomeChange >= 0 ? "#22c55e" : "#ef4444" },
                ]}
              >
                {incomeChange >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(incomeChange).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Expense */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? "#0f172a" : "#fff5f5",
              borderColor: "#ef444422",
            },
          ]}
        >
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: subText }]}>
              Total Expense
            </Text>
            <View style={[styles.arrowBadge, { backgroundColor: "#ef444418" }]}>
              <TrendingDown size={12} color="#ef4444" />
            </View>
          </View>
          <Text
            style={[styles.statAmount, { color: textColor }]}
            numberOfLines={1}
          >
            {currencySymbol}
            {spent.toLocaleString("en-IN")}
          </Text>
          {expenseChange !== null && (
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    expenseChange <= 0 ? "#22c55e22" : "#ef444422",
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  { color: expenseChange <= 0 ? "#22c55e" : "#ef4444" },
                ]}
              >
                {expenseChange <= 0 ? "↓" : "↑"}{" "}
                {Math.abs(expenseChange).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Line chart ── */}
      <View
        style={[
          styles.chartBox,
          { backgroundColor: chartBg, borderColor: border },
        ]}
      >
        <Text style={[styles.chartTitle, { color: subText }]}>
          Past 5 months
        </Text>

        <Svg width={chartW} height={CHART_H}>
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = CHART_H - CHART_PAD - p * innerH;
            return (
              <Line
                key={i}
                x1={CHART_PAD}
                y1={y}
                x2={chartW - CHART_PAD}
                y2={y}
                stroke={gridLine}
                strokeWidth={1}
              />
            );
          })}

          {/* Income line */}
          <Polyline
            points={toPolyline(incomePoints)}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Expense line */}
          <Polyline
            points={toPolyline(expensePoints)}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {incomePoints.map((pt, i) => (
            <SvgCircle
              key={`i${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="#22c55e"
            />
          ))}
          {expensePoints.map((pt, i) => (
            <SvgCircle
              key={`e${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="#ef4444"
            />
          ))}
        </Svg>

        {/* X-axis labels */}
        <View style={[styles.chartLabels, { paddingHorizontal: CHART_PAD }]}>
          {last5.map((m, i) => (
            <Text key={i} style={[styles.chartLabel, { color: subText }]}>
              {m.label}
            </Text>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
            <Text style={[styles.legendText, { color: subText }]}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
            <Text style={[styles.legendText, { color: subText }]}>Expense</Text>
          </View>
        </View>
      </View>

      {/* ── Category breakdown ── */}
      {breakdown.length > 0 && (
        <>
          <Text style={[styles.breakdownTitle, { color: textColor }]}>
            Breakdown by Category Expenses (This Month):
          </Text>

          {/* Colored bar */}
          <View style={styles.colorBar}>
            {breakdown.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.colorSegment,
                  {
                    flex: item.amount / totalBreakdown,
                    backgroundColor: item.cat.color,
                  },
                ]}
              />
            ))}
          </View>

          {/* Category rows */}
          {breakdown.map((item, i) => (
            <View key={i} style={styles.catRow}>
              <View
                style={[styles.catDot, { backgroundColor: item.cat.color }]}
              />
              <Text style={[styles.catName, { color: textColor }]}>
                {item.cat.name}
              </Text>
              <Text style={[styles.catAmount, { color: textColor }]}>
                {currencySymbol}
                {item.amount.toLocaleString("en-IN")}
              </Text>
              <Text style={[styles.catPct, { color: subText }]}>
                {Math.round((item.amount / totalBreakdown) * 100)}%
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title:    { fontSize: 16, fontFamily: F.semi,    marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: F.body,    marginBottom: 14, lineHeight: 18 },

  // Stat cards
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel:  { fontSize: 11, fontFamily: F.semi },
  arrowBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statAmount:  { fontSize: 15, fontFamily: F.heading },
  changeBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  changeText:  { fontSize: 11, fontFamily: F.semi },

  // Chart
  chartBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  chartTitle:  { fontSize: 11, fontFamily: F.semi, marginBottom: 8 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  chartLabel:  { fontSize: 10, fontFamily: F.body },
  legend:      { flexDirection: "row", gap: 14, marginTop: 8 },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: 11, fontFamily: F.body },

  // Breakdown
  breakdownTitle: { fontSize: 12, fontFamily: F.semi, marginBottom: 10 },
  colorBar:       { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  colorSegment:   { height: 8 },
  catRow:         { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  catDot:         { width: 10, height: 10, borderRadius: 5 },
  catName:        { flex: 1, fontSize: 13, fontFamily: F.body },
  catAmount:      { fontSize: 13, fontFamily: F.semi },
  catPct:         { fontSize: 12, fontFamily: F.body, minWidth: 32, textAlign: "right" },
});
