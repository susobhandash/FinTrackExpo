import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Rect as SvgRect,
  Text as SvgText,
  Circle,
  G,
} from "react-native-svg";

import { useApp } from "@/context/AppContext";
import { F } from "@/utils/fonts";
import type { Transaction, Category } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo && d <= now;
    }
    if (period === "Month") {
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }
    // Year
    return d.getFullYear() === now.getFullYear();
  });
}

// ── 6-Month Trend Bar Chart ───────────────────────────────────────────────────

const BAR_CHART_H = 100;
const GROUP_W = 44;
const BAR_W = 14;
const BAR_GAP = 4;

interface TrendChartProps {
  transactions: Transaction[];
  isDark: boolean;
}

function TrendBarChart({ transactions, isDark }: TrendChartProps) {
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";

  const now = new Date();
  const months = useMemo(() => {
    const arr: { key: string; label: string; isCurrent: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({
        key: getMonthKey(d),
        label: MONTHS_SHORT[d.getMonth()],
        isCurrent: i === 0,
      });
    }
    return arr;
  }, []);

  const data = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    months.forEach((m) => { map[m.key] = { income: 0, expense: 0 }; });
    transactions.forEach((tx) => {
      const key = getMonthKey(new Date(tx.date));
      if (!map[key]) return;
      if (tx.type === "Income") map[key].income += parseFloat(tx.amount) || 0;
      if (tx.type === "Expense") map[key].expense += parseFloat(tx.amount) || 0;
    });
    return months.map((m) => ({ ...m, ...map[m.key] }));
  }, [transactions, months]);

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const svgWidth = GROUP_W * 6 + 8;
  const LABEL_H = 18;

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
      <Svg width={svgWidth} height={BAR_CHART_H + LABEL_H}>
        {data.map((item, i) => {
          const incH = Math.max((item.income / maxVal) * BAR_CHART_H, 2);
          const expH = Math.max((item.expense / maxVal) * BAR_CHART_H, 2);
          const groupX = i * GROUP_W + 4;
          const opacity = item.isCurrent ? 1 : 0.45;

          return (
            <React.Fragment key={item.key}>
              {/* Income bar */}
              <SvgRect
                x={groupX}
                y={BAR_CHART_H - incH}
                width={BAR_W}
                height={incH}
                rx={4}
                fill="#34d399"
                opacity={opacity}
              />
              {/* Expense bar */}
              <SvgRect
                x={groupX + BAR_W + BAR_GAP}
                y={BAR_CHART_H - expH}
                width={BAR_W}
                height={expH}
                rx={4}
                fill="#f87171"
                opacity={opacity}
              />
              {/* Label */}
              <SvgText
                x={groupX + BAR_W}
                y={BAR_CHART_H + LABEL_H - 2}
                textAnchor="middle"
                fontSize={10}
                fill={item.isCurrent ? textColor : subText}
                fontFamily={F.semi}
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  legend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, fontFamily: F.body },
});

// ── Period Donut ──────────────────────────────────────────────────────────────

const PIE_SIZE = 160;
const PIE_R = 58;
const PIE_SW = 20;
const PIE_CIRC = 2 * Math.PI * PIE_R;

interface PeriodDonutProps {
  income: number;
  expense: number;
  isDark: boolean;
}

function PeriodDonut({ income, expense, isDark }: PeriodDonutProps) {
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";

  const total = income + expense;
  const net = income - expense;

  const incDash = total > 0 ? (income / total) * PIE_CIRC : 0;
  const expDash = total > 0 ? (expense / total) * PIE_CIRC : 0;

  return (
    <View style={donutStyles.row}>
      <View style={donutStyles.svgWrap}>
        <Svg width={PIE_SIZE} height={PIE_SIZE}>
          <G rotation="-90" origin={`${PIE_SIZE / 2},${PIE_SIZE / 2}`}>
            {total > 0 ? (
              <>
                <Circle
                  cx={PIE_SIZE / 2}
                  cy={PIE_SIZE / 2}
                  r={PIE_R}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={PIE_SW}
                  strokeDasharray={`${incDash} ${PIE_CIRC - incDash}`}
                  strokeDashoffset={0}
                />
                <Circle
                  cx={PIE_SIZE / 2}
                  cy={PIE_SIZE / 2}
                  r={PIE_R}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth={PIE_SW}
                  strokeDasharray={`${expDash} ${PIE_CIRC - expDash}`}
                  strokeDashoffset={-incDash}
                />
              </>
            ) : (
              <Circle
                cx={PIE_SIZE / 2}
                cy={PIE_SIZE / 2}
                r={PIE_R}
                fill="none"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth={PIE_SW}
              />
            )}
          </G>
        </Svg>
        {/* Center text */}
        <View style={donutStyles.centerText}>
          <Text style={[donutStyles.netLabel, { color: subText }]}>Net</Text>
          <Text style={[donutStyles.netAmount, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
            ₹{fmt(Math.abs(net))}
          </Text>
        </View>
      </View>

      <View style={donutStyles.legend}>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: "#34d399" }]} />
          <View>
            <Text style={[donutStyles.legendType, { color: subText }]}>Income</Text>
            <Text style={[donutStyles.legendAmt, { color: "#34d399" }]}>₹{fmt(income)}</Text>
          </View>
        </View>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: "#f87171" }]} />
          <View>
            <Text style={[donutStyles.legendType, { color: subText }]}>Expense</Text>
            <Text style={[donutStyles.legendAmt, { color: "#f87171" }]}>₹{fmt(expense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  svgWrap: { position: "relative", justifyContent: "center", alignItems: "center" },
  centerText: {
    position: "absolute",
    alignItems: "center",
  },
  netLabel: { fontSize: 11, fontFamily: F.body },
  netAmount: { fontSize: 14, fontFamily: F.semi },
  legend: { flex: 1, gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendType: { fontSize: 11, fontFamily: F.body, marginBottom: 2 },
  legendAmt: { fontSize: 15, fontFamily: F.semi },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { transactions, categories, config } = useApp();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const [period, setPeriod] = useState<Period>("Month");

  const periodTx = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period]
  );

  const { income, expense, net } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    periodTx.forEach((tx) => {
      if (tx.type === "Income") inc += parseFloat(tx.amount) || 0;
      if (tx.type === "Expense") exp += parseFloat(tx.amount) || 0;
    });
    return { income: inc, expense: exp, net: inc - exp };
  }, [periodTx]);

  // Top expense categories
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.forEach((tx) => {
      if (tx.type !== "Expense" || !tx.categoryId) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + (parseFloat(tx.amount) || 0);
    });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return { catId, amount, cat };
      })
      .filter((e) => e.cat)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodTx, categories]);

  const savingsRate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

  const PERIODS: Period[] = ["Week", "Month", "Year"];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={isDark ? ["#6d28d9", "#1e1b4b"] : ["#7c3aed", "#1e293b"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>Insights</Text>

          {/* Period selector */}
          <View style={styles.periodPill}>
            {PERIODS.map((p) => {
              const active = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[styles.periodPillItem, active && styles.periodPillActive]}
                >
                  <Text style={[styles.periodPillText, { color: active ? "#0f172a" : "rgba(255,255,255,0.7)" }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary card */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? "#1e1b4b" : "#ffffff" }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Net</Text>
              <Text style={[styles.summaryValue, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
                ₹{fmt(Math.abs(net))}
              </Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: "#34d399" }]}>₹{fmt(income)}</Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subText }]}>Spent</Text>
              <Text style={[styles.summaryValue, { color: "#f87171" }]}>₹{fmt(expense)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 6-Month Trend Chart ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>6-Month Trend</Text>
          <TrendBarChart transactions={transactions} isDark={isDark} />
        </View>

        {/* ── Period Breakdown Donut ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Period Breakdown</Text>
          <PeriodDonut income={income} expense={expense} isDark={isDark} />
        </View>

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
                      <Text style={[styles.catAmount, { color: textColor }]}>₹{fmt(amount)}</Text>
                      <Text style={[styles.catPct, { color: subText }]}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(pct, 100)}%` as any, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Savings Rate ── */}
        {income > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Savings Rate</Text>
            <Text style={[styles.savingsPct, { color: "#34d399" }]}>
              {savingsRate.toFixed(1)}%
            </Text>
            <Text style={[styles.savingsCaption, { color: subText }]}>
              of income saved this {period.toLowerCase()}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: border, marginTop: 10 }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(savingsRate, 100)}%` as any,
                    backgroundColor: "#34d399",
                  },
                ]}
              />
            </View>
          </View>
        )}
      </ScrollView>
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
    minHeight: 220,
  },
  heroTitle: { fontSize: 28, fontFamily: F.heading, color: "#f1f5f9", marginBottom: 12 },

  // Period pill
  periodPill: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  periodPillItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  periodPillActive: { backgroundColor: "#f1f5f9" },
  periodPillText: { fontSize: 13, fontFamily: F.semi },

  // Summary card
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 11, fontFamily: F.body },
  summaryValue: { fontSize: 14, fontFamily: F.semi },
  vertDivider: { width: 1, height: 36, marginHorizontal: 8 },

  // Card
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontFamily: F.title, marginBottom: 14 },

  // Category rows
  catRow: { marginBottom: 12 },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  catLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 13, fontFamily: F.semi },
  catRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  catAmount: { fontSize: 13, fontFamily: F.semi },
  catPct: { fontSize: 11, fontFamily: F.body, minWidth: 36, textAlign: "right" },

  // Progress
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },

  // Savings
  savingsPct: { fontSize: 40, fontFamily: F.heading, marginBottom: 4 },
  savingsCaption: { fontSize: 13, fontFamily: F.body },
});
