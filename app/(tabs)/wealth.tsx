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
import Svg, { Circle, G } from "react-native-svg";
import { Plus, X, TrendingUp, TrendingDown, Pencil } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import {
  ACCOUNT_TYPES,
  INVESTMENT_TYPES,
  INVESTMENT_TYPE_COLORS,
  ACCOUNT_GRADIENT_PAIRS,
} from "@/types";
import type { Account, Investment, Loan } from "@/types";
import SwipeableCardStack from "@/components/SwipeableCardStack";
import { hapticSuccess, hapticError, hapticLight } from "@/utils/haptics";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtShort(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ── Shared form styles ────────────────────────────────────────────────────────

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 22 },
  title:     { fontSize: 18, fontFamily: F.title, marginBottom: 16 },
  label:     { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: F.body,
    marginBottom: 4,
  },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  chipText:    { fontSize: 13, fontFamily: F.semi },
  typeGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeGridChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
  },
  toggleBtnText: { fontSize: 14, fontFamily: F.semi },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#34d399",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
  colorSwatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  colorSwatchWrap: {
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: { borderColor: "#f1f5f9" },
  colorSwatch: { width: 36, height: 36, borderRadius: 9 },
});

// ── Add Account Form ──────────────────────────────────────────────────────────

function AddAccountForm({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { addAccount, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]       = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType]       = useState<Account["type"]>("Bank");
  const [colorIdx, setColorIdx] = useState("0");

  const handleSave = async () => {
    if (!name.trim()) { hapticError(); showToast("Enter account name", "error"); return; }
    const bal = parseFloat(balance);
    if (isNaN(bal)) { hapticError(); showToast("Enter a valid balance", "error"); return; }
    await addAccount({ name: name.trim(), balance: bal.toString(), type, color: colorIdx });
    hapticSuccess();
    showToast("Account added");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Add Account</Text>

      <Text style={[fStyles.label, { color: subText }]}>Account Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="e.g. HDFC Savings"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Opening Balance (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={balance}
        onChangeText={setBalance}
      />

      <Text style={[fStyles.label, { color: subText }]}>Account Type</Text>
      <View style={fStyles.chipRow}>
        {ACCOUNT_TYPES.map((t) => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                fStyles.chip,
                { borderColor: "#34d399", backgroundColor: active ? "#34d399" : inputBg },
              ]}
            >
              <Text style={[fStyles.chipText, { color: active ? "#0f172a" : textColor }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Card Color</Text>
      <View style={fStyles.colorSwatchRow}>
        {ACCOUNT_GRADIENT_PAIRS.map((pair, idx) => {
          const selected = colorIdx === idx.toString();
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => { hapticLight(); setColorIdx(idx.toString()); }}
              style={[fStyles.colorSwatchWrap, selected && fStyles.colorSwatchSelected]}
            >
              <LinearGradient
                colors={pair}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={fStyles.colorSwatch}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Account</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Edit Account Form ─────────────────────────────────────────────────────────

function EditAccountForm({
  account,
  onClose,
  isDark,
}: {
  account: Account;
  onClose: () => void;
  isDark: boolean;
}) {
  const { updateAccount, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]       = useState(account.name);
  const [balance, setBalance] = useState(account.balance);
  const [type, setType]       = useState<Account["type"]>(account.type);
  const [colorIdx, setColorIdx] = useState(account.color ?? "0");

  const handleSave = async () => {
    if (!name.trim()) { hapticError(); showToast("Enter account name", "error"); return; }
    const bal = parseFloat(balance);
    if (isNaN(bal)) { hapticError(); showToast("Enter a valid balance", "error"); return; }
    await updateAccount({ ...account, name: name.trim(), balance: bal.toString(), type, color: colorIdx });
    hapticSuccess();
    showToast("Account updated");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Edit Account</Text>

      <Text style={[fStyles.label, { color: subText }]}>Account Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="e.g. HDFC Savings"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Balance (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={balance}
        onChangeText={setBalance}
      />

      <Text style={[fStyles.label, { color: subText }]}>Account Type</Text>
      <View style={fStyles.chipRow}>
        {ACCOUNT_TYPES.map((t) => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                fStyles.chip,
                { borderColor: "#34d399", backgroundColor: active ? "#34d399" : inputBg },
              ]}
            >
              <Text style={[fStyles.chipText, { color: active ? "#0f172a" : textColor }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Card Color</Text>
      <View style={fStyles.colorSwatchRow}>
        {ACCOUNT_GRADIENT_PAIRS.map((pair, idx) => {
          const selected = colorIdx === idx.toString();
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => { hapticLight(); setColorIdx(idx.toString()); }}
              style={[fStyles.colorSwatchWrap, selected && fStyles.colorSwatchSelected]}
            >
              <LinearGradient
                colors={pair}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={fStyles.colorSwatch}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Add Investment Form ───────────────────────────────────────────────────────

function AddInvestmentForm({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { addInvestment, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]           = useState("");
  const [type, setType]           = useState<Investment["type"]>("MF");
  const [invested, setInvested]   = useState("");
  const [currentVal, setCurrentVal] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { hapticError(); showToast("Enter investment name", "error"); return; }
    const inv = parseFloat(invested);
    const cur = parseFloat(currentVal);
    if (isNaN(inv) || isNaN(cur)) { hapticError(); showToast("Enter valid amounts", "error"); return; }
    await addInvestment({
      name: name.trim(),
      type,
      investedAmount: inv.toString(),
      currentValue: cur.toString(),
      date: new Date().toISOString(),
    });
    hapticSuccess();
    showToast("Investment added");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Add Investment</Text>

      <Text style={[fStyles.label, { color: subText }]}>Investment Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="e.g. Axis Bluechip MF"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Type</Text>
      <View style={fStyles.typeGrid}>
        {INVESTMENT_TYPES.map((t) => {
          const active = type === t;
          const color  = INVESTMENT_TYPE_COLORS[t];
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                fStyles.typeGridChip,
                { borderColor: color, backgroundColor: active ? color : `${color}18` },
              ]}
            >
              <Text style={[fStyles.chipText, { color: active ? "#fff" : color }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Amount Invested (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={invested}
        onChangeText={setInvested}
      />

      <Text style={[fStyles.label, { color: subText }]}>Current Value (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={currentVal}
        onChangeText={setCurrentVal}
      />

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Investment</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Edit Investment Form ──────────────────────────────────────────────────────

function EditInvestmentForm({
  investment,
  onClose,
  isDark,
}: {
  investment: Investment;
  onClose: () => void;
  isDark: boolean;
}) {
  const { updateInvestment, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]           = useState(investment.name);
  const [type, setType]           = useState<Investment["type"]>(investment.type);
  const [invested, setInvested]   = useState(investment.investedAmount);
  const [currentVal, setCurrentVal] = useState(investment.currentValue);

  const handleSave = async () => {
    if (!name.trim()) { hapticError(); showToast("Enter investment name", "error"); return; }
    const inv = parseFloat(invested);
    const cur = parseFloat(currentVal);
    if (isNaN(inv) || isNaN(cur)) { hapticError(); showToast("Enter valid amounts", "error"); return; }
    await updateInvestment({
      ...investment,
      name: name.trim(),
      type,
      investedAmount: inv.toString(),
      currentValue: cur.toString(),
    });
    hapticSuccess();
    showToast("Investment updated");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Edit Investment</Text>

      <Text style={[fStyles.label, { color: subText }]}>Investment Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="e.g. Axis Bluechip MF"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Type</Text>
      <View style={fStyles.typeGrid}>
        {INVESTMENT_TYPES.map((t) => {
          const active = type === t;
          const color  = INVESTMENT_TYPE_COLORS[t];
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                fStyles.typeGridChip,
                { borderColor: color, backgroundColor: active ? color : `${color}18` },
              ]}
            >
              <Text style={[fStyles.chipText, { color: active ? "#fff" : color }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Amount Invested (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={invested}
        onChangeText={setInvested}
      />

      <Text style={[fStyles.label, { color: subText }]}>Current Value (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={currentVal}
        onChangeText={setCurrentVal}
      />

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Add Loan Form ─────────────────────────────────────────────────────────────

function AddLoanForm({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { addLoan, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [loanType, setLoanType]     = useState<"lent" | "borrowed">("lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount]         = useState("");
  const [note, setNote]             = useState("");

  const handleSave = async () => {
    if (!personName.trim()) { hapticError(); showToast("Enter person name", "error"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { hapticError(); showToast("Enter a valid amount", "error"); return; }
    await addLoan({
      personName: personName.trim(),
      amount: amt.toString(),
      type: loanType,
      date: new Date().toISOString(),
      note: note.trim(),
    });
    hapticSuccess();
    showToast("Loan recorded");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Add Loan</Text>

      <View style={fStyles.toggleRow}>
        <TouchableOpacity
          onPress={() => setLoanType("lent")}
          style={[
            fStyles.toggleBtn,
            { borderColor: "#34d399" },
            loanType === "lent" && { backgroundColor: "#34d399" },
          ]}
        >
          <Text style={[fStyles.toggleBtnText, { color: loanType === "lent" ? "#0f172a" : "#34d399" }]}>
            ↗ I Lent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLoanType("borrowed")}
          style={[
            fStyles.toggleBtn,
            { borderColor: "#f87171" },
            loanType === "borrowed" && { backgroundColor: "#f87171" },
          ]}
        >
          <Text style={[fStyles.toggleBtnText, { color: loanType === "borrowed" ? "#fff" : "#f87171" }]}>
            ↙ I Borrowed
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Person Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="e.g. Rahul"
        placeholderTextColor={subText}
        value={personName}
        onChangeText={setPersonName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Amount (₹)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="0.00"
        placeholderTextColor={subText}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[fStyles.label, { color: subText }]}>Note (optional)</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
        placeholder="What's this for?"
        placeholderTextColor={subText}
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Loan</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

const DONUT_SIZE = 130;
const DONUT_R    = 48;
const DONUT_SW   = 16;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

interface DonutSegment { type: string; value: number; color: string; }

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let offset = 0;
  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      <G rotation="-90" origin={`${DONUT_SIZE / 2},${DONUT_SIZE / 2}`}>
        {segments.map((seg) => {
          const dash = (seg.value / total) * DONUT_CIRC;
          const gap  = DONUT_CIRC - dash;
          const el   = (
            <Circle
              key={seg.type}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_R}
              fill="none"
              stroke={seg.color}
              strokeWidth={DONUT_SW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </G>
    </Svg>
  );
}

// ── Wallets Tab ───────────────────────────────────────────────────────────────

const ACCOUNT_CATEGORIES = ["Bank", "Cash", "Wallet", "Credit"] as const;

interface WalletsTabProps {
  isDark: boolean;
  onEditAccount: (acc: Account) => void;
}

function WalletsTab({ isDark, onEditAccount }: WalletsTabProps) {
  const { accounts, deleteAccount } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";

  const assets = useMemo(
    () =>
      accounts
        .filter((a) => a.type !== "Credit")
        .reduce((s, a) => s + Math.max(0, parseFloat(a.balance || "0")), 0),
    [accounts]
  );
  const liabilities = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "Credit")
        .reduce((s, a) => s + Math.abs(parseFloat(a.balance || "0")), 0),
    [accounts]
  );
  const netWorth = assets - liabilities;

  const categorised = useMemo(
    () =>
      ACCOUNT_CATEGORIES.map((cat) => ({
        cat,
        list: accounts.filter((a) => a.type === cat),
      })).filter(({ list }) => list.length > 0),
    [accounts]
  );

  return (
    <>
      {/* Summary card */}
      <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
        <View style={styles.heroCardRow}>
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>Assets</Text>
            <Text style={[styles.heroCardValue, { color: "#34d399" }]}>₹{fmt(assets)}</Text>
          </View>
          <View style={[styles.heroCardDivider, { backgroundColor: border }]} />
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>Liabilities</Text>
            <Text style={[styles.heroCardValue, { color: "#f87171" }]}>₹{fmt(liabilities)}</Text>
          </View>
        </View>
        <View style={[styles.heroCardHDivider, { backgroundColor: border }]} />
        <View style={styles.heroCardNetRow}>
          <Text style={[styles.heroCardLabel, { color: subText }]}>Net Worth</Text>
          <Text style={[styles.heroNetAmount, { color: netWorth >= 0 ? "#34d399" : "#f87171" }]}>
            ₹{fmt(netWorth)}
          </Text>
        </View>
      </View>

      {/* Category stacks */}
      <View style={styles.listSection}>
        {accounts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.emptyText, { color: subText }]}>No accounts yet</Text>
          </View>
        ) : (
          categorised.map(({ cat, list }) => (
            <SwipeableCardStack
              key={cat}
              category={cat}
              accounts={list}
              isDark={isDark}
              onDelete={deleteAccount}
              onEdit={onEditAccount}
            />
          ))
        )}
      </View>
    </>
  );
}

// ── Investments Tab ───────────────────────────────────────────────────────────

interface InvestmentsTabProps {
  isDark: boolean;
  onEditInvestment: (inv: Investment) => void;
}

function InvestmentsTab({ isDark, onEditInvestment }: InvestmentsTabProps) {
  const { investments, deleteInvestment } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";

  const portfolioValue = useMemo(
    () => investments.reduce((s, inv) => s + parseFloat(inv.currentValue || "0"), 0),
    [investments]
  );
  const totalInvested = useMemo(
    () => investments.reduce((s, inv) => s + parseFloat(inv.investedAmount || "0"), 0),
    [investments]
  );
  const totalGain = portfolioValue - totalInvested;
  const gainPct   = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const allocation = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach((inv) => {
      const v = parseFloat(inv.currentValue || "0");
      map[inv.type] = (map[inv.type] || 0) + v;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([type, value]) => ({ type, value, color: INVESTMENT_TYPE_COLORS[type] ?? "#94a3b8" }));
  }, [investments]);

  return (
    <>
      {/* Hero summary */}
      <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
        <View style={styles.investHeroTop}>
          <View>
            <Text style={[styles.heroCardLabel, { color: subText }]}>Portfolio Value</Text>
            <Text style={[styles.bigAmount, { color: textColor }]}>₹{fmt(portfolioValue)}</Text>
          </View>
          <View
            style={[
              styles.gainBadge,
              { backgroundColor: gainPct >= 0 ? "#34d39920" : "#f8717120" },
            ]}
          >
            {gainPct >= 0 ? (
              <TrendingUp size={12} color="#34d399" />
            ) : (
              <TrendingDown size={12} color="#f87171" />
            )}
            <Text style={[styles.gainBadgeText, { color: gainPct >= 0 ? "#34d399" : "#f87171" }]}>
              {gainPct >= 0 ? "+" : ""}
              {gainPct.toFixed(1)}%
            </Text>
          </View>
        </View>
        <View style={[styles.heroCardHDivider, { backgroundColor: border }]} />
        <View style={styles.heroCardRow}>
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>Invested</Text>
            <Text style={[styles.heroCardValue, { color: textColor }]}>₹{fmt(totalInvested)}</Text>
          </View>
          <View style={[styles.heroCardDivider, { backgroundColor: border }]} />
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>Gain / Loss</Text>
            <Text style={[styles.heroCardValue, { color: totalGain >= 0 ? "#34d399" : "#f87171" }]}>
              {totalGain >= 0 ? "+" : ""}₹{fmt(Math.abs(totalGain))}
            </Text>
          </View>
        </View>
      </View>

      {/* Donut chart */}
      {allocation.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Asset Allocation</Text>
          <View style={styles.donutRow}>
            <DonutChart segments={allocation} />
            <View style={styles.donutLegend}>
              {allocation.map((seg) => (
                <View key={seg.type} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                  <Text style={[styles.legendLabel, { color: subText }]}>{seg.type}</Text>
                  <Text style={[styles.legendPct, { color: textColor }]}>
                    {portfolioValue > 0
                      ? `${((seg.value / portfolioValue) * 100).toFixed(0)}%`
                      : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Holdings */}
      <View style={styles.listSection}>
        {investments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.emptyText, { color: subText }]}>No investments yet</Text>
          </View>
        ) : (
          investments.map((inv) => {
            const invested  = parseFloat(inv.investedAmount || "0");
            const current   = parseFloat(inv.currentValue || "0");
            const gain      = current - invested;
            const pct       = invested > 0 ? (gain / invested) * 100 : 0;
            const typeColor = INVESTMENT_TYPE_COLORS[inv.type] ?? "#94a3b8";

            return (
              <View
                key={inv.id}
                style={[styles.investCard, { backgroundColor: cardBg, borderColor: border }]}
              >
                <View style={styles.investCardHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColor}22` }]}>
                    <Text style={[styles.typeBadgeText, { color: typeColor }]}>{inv.type}</Text>
                  </View>
                  <View style={styles.investCardActions}>
                    <TouchableOpacity onPress={() => onEditInvestment(inv)} hitSlop={8}>
                      <Pencil size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteInvestment(inv.id)} hitSlop={8}>
                      <X size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.investName, { color: textColor }]} numberOfLines={1}>
                  {inv.name}
                </Text>
                <View style={styles.investAmountRow}>
                  <View>
                    <Text style={[styles.investAmountLabel, { color: subText }]}>Invested</Text>
                    <Text style={[styles.investAmount, { color: textColor }]}>₹{fmt(invested)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.investAmountLabel, { color: subText }]}>Current</Text>
                    <Text style={[styles.investAmount, { color: textColor }]}>₹{fmt(current)}</Text>
                  </View>
                </View>
                <View style={[styles.gainRow, { backgroundColor: pct >= 0 ? "#34d39914" : "#f8717114", borderRadius: 8 }]}>
                  <Text style={[styles.gainText, { color: pct >= 0 ? "#34d399" : "#f87171" }]}>
                    {pct >= 0 ? "+" : ""}{pct.toFixed(1)}% ({pct >= 0 ? "+" : ""}₹{fmt(Math.abs(gain))})
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

// ── Loans Tab ─────────────────────────────────────────────────────────────────

type LoanFilter = "All" | "They Owe" | "I Owe";
const LOAN_FILTERS: LoanFilter[] = ["All", "They Owe", "I Owe"];

function LoansTab({ isDark }: { isDark: boolean }) {
  const { loans, settleLoan, deleteLoan } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const chipBase  = isDark ? "#2d2b5e" : "#e2e8f0";

  const [filter, setFilter] = useState<LoanFilter>("All");

  const activeLoans  = useMemo(() => loans.filter((l) => !l.settled), [loans]);
  const theyOweTotal = useMemo(
    () => activeLoans.filter((l) => l.type === "lent").reduce((s, l) => s + parseFloat(l.amount || "0"), 0),
    [activeLoans]
  );
  const iOweTotal = useMemo(
    () => activeLoans.filter((l) => l.type === "borrowed").reduce((s, l) => s + parseFloat(l.amount || "0"), 0),
    [activeLoans]
  );

  const filtered = useMemo(() => {
    if (filter === "They Owe") return loans.filter((l) => l.type === "lent");
    if (filter === "I Owe")    return loans.filter((l) => l.type === "borrowed");
    return loans;
  }, [loans, filter]);

  const formatLoanDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  return (
    <>
      {/* Hero summary */}
      <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
        <View style={styles.heroCardRow}>
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>They Owe Me</Text>
            <Text style={[styles.heroCardValue, { color: "#34d399" }]}>₹{fmt(theyOweTotal)}</Text>
          </View>
          <View style={[styles.heroCardDivider, { backgroundColor: border }]} />
          <View style={styles.heroCardItem}>
            <Text style={[styles.heroCardLabel, { color: subText }]}>I Owe Them</Text>
            <Text style={[styles.heroCardValue, { color: "#f87171" }]}>₹{fmt(iOweTotal)}</Text>
          </View>
        </View>
      </View>

      {/* Filter chips — horizontal scroll to prevent wrapping */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {LOAN_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, { backgroundColor: active ? "#34d399" : chipBase }]}
            >
              <Text style={[styles.filterChipText, { color: active ? "#0f172a" : textColor }]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loan list */}
      <View style={styles.listSection}>
        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.emptyText, { color: subText }]}>No loans found</Text>
          </View>
        ) : (
          filtered.map((loan) => {
            const isLent      = loan.type === "lent";
            const accentColor = isLent ? "#34d399" : "#f87171";
            const initial     = loan.personName.charAt(0).toUpperCase();

            return (
              <View
                key={loan.id}
                style={[
                  styles.loanCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: border,
                    borderLeftColor: accentColor,
                    opacity: loan.settled ? 0.55 : 1,
                  },
                ]}
              >
                <View style={styles.loanCardInner}>
                  <View style={[styles.loanAvatar, { backgroundColor: `${accentColor}22` }]}>
                    <Text style={[styles.loanAvatarText, { color: accentColor }]}>{initial}</Text>
                  </View>
                  <View style={styles.loanInfo}>
                    <View style={styles.loanNameRow}>
                      <Text style={[styles.loanName, { color: textColor }]}>{loan.personName}</Text>
                      {loan.settled && (
                        <View style={[styles.settledBadge, { backgroundColor: "#34d39920" }]}>
                          <Text style={styles.settledBadgeText}>Settled</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.loanDate, { color: subText }]}>
                      {isLent ? "Lent" : "Borrowed"} · {formatLoanDate(loan.date)}
                    </Text>
                    {loan.note ? (
                      <Text style={[styles.loanNote, { color: subText }]} numberOfLines={1}>
                        {loan.note}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.loanRight}>
                    <Text style={[styles.loanAmount, { color: accentColor }]}>
                      ₹{fmtShort(parseFloat(loan.amount || "0"))}
                    </Text>
                    <TouchableOpacity onPress={() => deleteLoan(loan.id)} hitSlop={8} style={styles.loanDeleteBtn}>
                      <X size={14} color={subText} />
                    </TouchableOpacity>
                  </View>
                </View>
                {!loan.settled && (
                  <TouchableOpacity
                    onPress={() => { hapticLight(); settleLoan(loan.id); }}
                    style={[styles.settleBtn, { borderColor: accentColor }]}
                  >
                    <Text style={[styles.settleBtnText, { color: accentColor }]}>Mark Settled</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type WealthTab = "Wallets" | "Investments" | "Loans";
const WEALTH_TABS: WealthTab[] = ["Wallets", "Investments", "Loans"];

const HERO_GRADIENTS_DARK: Record<WealthTab, [string, string]> = {
  Wallets:     ["#1e1b4b", "#0f0c29"],
  Investments: ["#064e3b", "#1e1b4b"],
  Loans:       ["#4c1d95", "#1e1b4b"],
};
const HERO_GRADIENTS_LIGHT: Record<WealthTab, [string, string]> = {
  Wallets:     ["#3730a3", "#1e293b"],
  Investments: ["#065f46", "#1e293b"],
  Loans:       ["#6d28d9", "#1e293b"],
};

export default function WealthScreen() {
  const { config, accounts, investments, loans } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark    = config.theme === "dark";
  const bg        = isDark ? "#0f0c29" : "#f8fafc";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";

  const [activeTab, setActiveTab] = useState<WealthTab>("Wallets");

  // ── Hero summary figures ───────────────────────────────────────────────────

  const walletsTotal = useMemo(
    () =>
      accounts
        .filter((a) => a.type !== "Credit")
        .reduce((s, a) => s + parseFloat(a.balance || "0"), 0),
    [accounts]
  );

  const investmentsTotal = useMemo(
    () => investments.reduce((s, inv) => s + parseFloat(inv.currentValue || "0"), 0),
    [investments]
  );

  const loansNet = useMemo(() => {
    const lent = loans
      .filter((l) => !l.settled && l.type === "lent")
      .reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
    const borrowed = loans
      .filter((l) => !l.settled && l.type === "borrowed")
      .reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
    return lent - borrowed;
  }, [loans]);

  // ── Sheet openers ──────────────────────────────────────────────────────────

  const openAccountSheet = () =>
    openSheet({ isDark, children: <AddAccountForm onClose={closeSheet} isDark={isDark} /> });

  const openInvestmentSheet = () =>
    openSheet({ isDark, children: <AddInvestmentForm onClose={closeSheet} isDark={isDark} /> });

  const openLoanSheet = () =>
    openSheet({ isDark, children: <AddLoanForm onClose={closeSheet} isDark={isDark} /> });

  const openAddSheet = () => {
    if (activeTab === "Wallets")     openAccountSheet();
    else if (activeTab === "Investments") openInvestmentSheet();
    else openLoanSheet();
  };

  const openEditAccountSheet = (acc: Account) =>
    openSheet({
      isDark,
      children: <EditAccountForm account={acc} onClose={closeSheet} isDark={isDark} />,
    });

  const openEditInvestmentSheet = (inv: Investment) =>
    openSheet({
      isDark,
      children: <EditInvestmentForm investment={inv} onClose={closeSheet} isDark={isDark} />,
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={isDark ? HERO_GRADIENTS_DARK[activeTab] : HERO_GRADIENTS_LIGHT[activeTab]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>Assets</Text>

          {/* Summary stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Wallets</Text>
              <Text style={styles.heroStatValue}>₹{fmt(walletsTotal)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Investments</Text>
              <Text style={styles.heroStatValue}>₹{fmt(investmentsTotal)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Loans Net</Text>
              <Text style={[styles.heroStatValue, { color: loansNet >= 0 ? "#34d399" : "#f87171" }]}>
                {loansNet >= 0 ? "+" : ""}₹{fmt(Math.abs(loansNet))}
              </Text>
            </View>
          </View>

          {/* Tab pill selector */}
          <View style={styles.tabPill}>
            {WEALTH_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabPillItem, active && styles.tabPillItemActive]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      { color: active ? "#0f172a" : "rgba(255,255,255,0.7)" },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {/* ── Tab content ── */}
        {activeTab === "Wallets" && (
          <WalletsTab isDark={isDark} onEditAccount={openEditAccountSheet} />
        )}
        {activeTab === "Investments" && (
          <InvestmentsTab isDark={isDark} onEditInvestment={openEditInvestmentSheet} />
        )}
        {activeTab === "Loans" && (
          <LoansTab isDark={isDark} />
        )}
      </ScrollView>

      {/* FAB — outside ScrollView so it stays above the content */}
      <TouchableOpacity style={styles.fab} onPress={() => { hapticLight(); openAddSheet(); }} activeOpacity={0.85}>
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
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: "space-between",
    gap: 16,
  },
  heroTitle: { fontSize: 26, fontFamily: F.heading, color: "#f1f5f9" },

  // Hero stats
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  heroStatItem: { flex: 1, alignItems: "center", gap: 4 },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: F.semi,
    color: "rgba(255,255,255,0.6)",
  },
  heroStatValue: { fontSize: 14, fontFamily: F.semi, color: "#fff" },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Tab pill
  tabPill: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  tabPillItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabPillItemActive: { backgroundColor: "#f1f5f9" },
  tabPillText: { fontSize: 13, fontFamily: F.semi },

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  heroCardRow: { flexDirection: "row", alignItems: "center" },
  heroCardItem: { flex: 1, alignItems: "center" },
  heroCardLabel: { fontSize: 11, fontFamily: F.body, marginBottom: 4 },
  heroCardValue: { fontSize: 15, fontFamily: F.semi },
  heroCardDivider: { width: 1, height: 36, marginHorizontal: 8 },
  heroCardHDivider: { height: 1, marginVertical: 12 },
  heroCardNetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroNetAmount: { fontSize: 20, fontFamily: F.heading },

  // Investment hero
  investHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bigAmount: { fontSize: 26, fontFamily: F.heading },
  gainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gainBadgeText: { fontSize: 12, fontFamily: F.semi },

  // Filter
  filterScroll: { paddingHorizontal: 20, paddingVertical: 14 },
  filterContent: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipText: { fontSize: 13, fontFamily: F.semi },

  // Section card
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 15, fontFamily: F.title, marginBottom: 12 },

  // Donut
  donutRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  donutLegend: { flex: 1, gap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 12, fontFamily: F.body },
  legendPct: { fontSize: 12, fontFamily: F.semi },

  // List section
  listSection: { paddingHorizontal: 20, gap: 12, marginTop: 8 },

  // Empty
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontFamily: F.body },

  // Investment card
  investCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  investCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  investCardActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: { fontSize: 11, fontFamily: F.semi },
  investName: { fontSize: 15, fontFamily: F.semi, marginBottom: 8 },
  investAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  investAmountLabel: { fontSize: 11, fontFamily: F.body, marginBottom: 2 },
  investAmount: { fontSize: 14, fontFamily: F.semi },
  gainRow: { paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  gainText: { fontSize: 13, fontFamily: F.semi },

  // Loan card
  loanCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: "hidden",
    padding: 14,
  },
  loanCardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  loanAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loanAvatarText: { fontSize: 16, fontFamily: F.heading },
  loanInfo: { flex: 1 },
  loanNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  loanName: { fontSize: 15, fontFamily: F.semi },
  settledBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  settledBadgeText: { fontSize: 10, fontFamily: F.semi, color: "#34d399" },
  loanDate: { fontSize: 11, fontFamily: F.body },
  loanNote: { fontSize: 11, fontFamily: F.body, marginTop: 2 },
  loanRight: { alignItems: "flex-end", gap: 6 },
  loanAmount: { fontSize: 16, fontFamily: F.semi },
  loanDeleteBtn: { padding: 2 },
  settleBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  settleBtnText: { fontSize: 13, fontFamily: F.semi },

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
