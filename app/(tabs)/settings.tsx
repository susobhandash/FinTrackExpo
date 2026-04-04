import React, { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Modal,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  Moon,
  Sun,
  Download,
  Upload,
  X,
  Pencil,
  Info,
  TrendingDown,
  ArrowLeftRight,
  TrendingUp,
  EyeIcon,
  EyeOffIcon,
  Bell,
  BellOff,
  User,
  TagIcon,
  Landmark,
  ChevronRight,
  ChevronDown,
  Coins,
  BookOpen,
  LayoutDashboard,
  BarChart2,
  PiggyBank,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  requestNotificationPermission,
  scheduleDaily,
  cancelScheduled,
} from "@/utils/notifications";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { useToast } from "@/context/ToastContext";
import { F } from "@/utils/fonts";
import {
  hapticSuccess,
  hapticError,
  hapticLight,
  hapticSelection,
} from "@/utils/haptics";
import type { Category } from "@/types";

// ── Color palette (shared) ────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#A3E635",
  "#34D399",
  "#22D3EE",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#94A3B8",
];

const TYPE_CONFIG: { value: Category["type"]; label: string; color: string }[] =
  [
    { value: "Expense", label: "Expense", color: "#ef4444" },
    { value: "Income", label: "Income", color: "#34d399" },
    { value: "Transfer", label: "Transfer", color: "#60a5fa" },
  ];

// ── Add Category Form ─────────────────────────────────────────────────────────

function AddCategoryForm({
  onClose,
  isDark,
}: {
  onClose: () => void;
  isDark: boolean;
}) {
  const { addCategory } = useApp();
  const { showToast } = useToast();

  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("Expense");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);

  const handleSave = async () => {
    if (!name.trim()) {
      hapticError();
      showToast("Enter category name", "error");
      return;
    }
    await addCategory({ name: name.trim(), type, color: selectedColor });
    hapticSuccess();
    showToast("Category added");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Add Category</Text>

      <Text style={[fStyles.label, { color: subText }]}>Name</Text>
      <TextInput
        style={[
          fStyles.input,
          { backgroundColor: inputBg, color: textColor, borderColor: border },
        ]}
        placeholder="e.g. Dining Out"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Type</Text>
      <View style={fStyles.typeRow}>
        {TYPE_CONFIG.map(({ value, label, color }) => {
          const active = type === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => {
                hapticSelection();
                setType(value);
              }}
              style={[
                fStyles.typeChip,
                { borderColor: color },
                active && { backgroundColor: color },
              ]}
            >
              <Text
                style={[
                  fStyles.typeChipText,
                  { color: active ? "#fff" : color },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Color</Text>
      <View style={fStyles.colorRow}>
        {COLOR_PALETTE.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => {
              hapticSelection();
              setSelectedColor(color);
            }}
            style={[
              fStyles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && fStyles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={fStyles.saveBtn}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={fStyles.saveBtnText}>Save Category</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Edit Category Form ────────────────────────────────────────────────────────

function EditCategoryForm({
  category,
  onClose,
  isDark,
}: {
  category: Category;
  onClose: () => void;
  isDark: boolean;
}) {
  const { updateCategory } = useApp();
  const { showToast } = useToast();

  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName] = useState(category.name);
  const [type, setType] = useState<Category["type"]>(category.type);
  const [selectedColor, setSelectedColor] = useState(
    COLOR_PALETTE.includes(category.color) ? category.color : COLOR_PALETTE[0],
  );

  const handleSave = async () => {
    if (!name.trim()) {
      hapticError();
      showToast("Enter category name", "error");
      return;
    }
    await updateCategory({
      ...category,
      name: name.trim(),
      type,
      color: selectedColor,
    });
    hapticSuccess();
    showToast("Category updated");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Edit Category</Text>

      <Text style={[fStyles.label, { color: subText }]}>Name</Text>
      <TextInput
        style={[
          fStyles.input,
          { backgroundColor: inputBg, color: textColor, borderColor: border },
        ]}
        placeholder="e.g. Dining Out"
        placeholderTextColor={subText}
        value={name}
        onChangeText={setName}
      />

      <Text style={[fStyles.label, { color: subText }]}>Type</Text>
      <View style={fStyles.typeRow}>
        {TYPE_CONFIG.map(({ value, label, color }) => {
          const active = type === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => {
                hapticSelection();
                setType(value);
              }}
              style={[
                fStyles.typeChip,
                { borderColor: color },
                active && { backgroundColor: color },
              ]}
            >
              <Text
                style={[
                  fStyles.typeChipText,
                  { color: active ? "#fff" : color },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[fStyles.label, { color: subText }]}>Color</Text>
      <View style={fStyles.colorRow}>
        {COLOR_PALETTE.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => {
              hapticSelection();
              setSelectedColor(color);
            }}
            style={[
              fStyles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && fStyles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={fStyles.saveBtn}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={fStyles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Import Sheet ──────────────────────────────────────────────────────────────

function ImportSheet({
  onClose,
  isDark,
}: {
  onClose: () => void;
  isDark: boolean;
}) {
  const { importData } = useApp();
  const { showToast } = useToast();

  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setFileName(asset.name);
      setStatus("loading");

      const json = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const data = JSON.parse(json);
      await importData(data);
      hapticSuccess();
      setStatus("success");
      showToast("Data imported successfully");
      onClose();
    } catch {
      hapticError();
      setStatus("error");
      showToast("Import failed — check the file format", "error");
    }
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Import Backup</Text>
      <Text style={[fStyles.instructionText, { color: subText }]}>
        Select a FinTrack backup (.json) file from your device. All existing
        data will be replaced.
      </Text>

      {fileName && status !== "idle" && (
        <View style={[fStyles.fileChip, { borderColor: border }]}>
          <Text
            style={[fStyles.fileChipText, { color: subText }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          {status === "loading" && (
            <Text style={[fStyles.statusText, { color: subText }]}>
              Importing…
            </Text>
          )}
          {status === "error" && (
            <Text style={[fStyles.statusText, { color: "#f87171" }]}>
              Failed
            </Text>
          )}
        </View>
      )}

      <View style={fStyles.importBtnRow}>
        <TouchableOpacity
          style={[fStyles.cancelBtn, { borderColor: border }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={[fStyles.cancelBtnText, { color: subText }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={fStyles.saveBtn}
          onPress={handlePickFile}
          activeOpacity={0.85}
          disabled={status === "loading"}
        >
          <Text style={fStyles.saveBtnText}>
            {status === "loading" ? "Importing…" : "Choose File"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Shared form styles ────────────────────────────────────────────────────────

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 22 },
  title: { fontSize: 18, fontFamily: F.title, marginBottom: 12 },
  label: { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: F.body,
    marginBottom: 4,
  },
  jsonInput: { minHeight: 120, paddingTop: 10 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  typeChipText: { fontSize: 13, fontFamily: F.semi },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: "#f1f5f9",
    transform: [{ scale: 1.15 }],
  },
  importBtnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: F.semi },
  saveBtn: {
    flex: 1,
    marginTop: 0,
    backgroundColor: "#34d399",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
  instructionText: {
    fontSize: 13,
    fontFamily: F.body,
    lineHeight: 20,
    marginBottom: 8,
  },
  fileChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fileChipText: { fontSize: 13, fontFamily: F.body, flex: 1, marginRight: 8 },
  statusText: { fontSize: 12, fontFamily: F.semi },
});

// ── Features Modal ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: LayoutDashboard,
    color: "#60a5fa",
    title: "Dashboard",
    tagline: "Your financial snapshot at a glance",
    bullets: [
      "Swipeable account cards show each account's current balance",
      "Instantly add income, expense or transfer transactions",
      "Weekly spending bar-chart (toggle on/off from Settings)",
      "Month-by-month spend summary with income vs expense totals",
    ],
  },
  {
    icon: Landmark,
    color: "#a78bfa",
    title: "Accounts",
    tagline: "Manage all your money pots",
    bullets: [
      "Create Bank, Cash, Wallet or Credit Card accounts",
      "Each account maintains its own independent balance",
      "Tap any account card on the Home screen to make it active",
      "Account balances auto-update as you log transactions",
    ],
  },
  {
    icon: ArrowLeftRight,
    color: "#34d399",
    title: "Transactions",
    tagline: "Every rupee tracked, nothing missed",
    bullets: [
      "Log expenses, income and transfers between your accounts",
      "Browse transactions month-by-month with running totals",
      "Filter by account or search by category",
      "Swipe a transaction card (right / left) to quickly edit or delete it",
      "Analysis card at the top shows category-wise spend breakdown",
    ],
  },
  {
    icon: PiggyBank,
    color: "#fb923c",
    title: "Budget",
    tagline: "Spend with intention, not regret",
    bullets: [
      "Set a monthly spending limit for any expense category",
      "Visual progress bars show how much of each budget is used",
      "Warning indicator fires when you're close to the limit",
      "Budgets automatically reset at the start of each month",
    ],
  },
  {
    icon: BarChart2,
    color: "#f472b6",
    title: "Analytics",
    tagline: "Deep-dive into your spending patterns",
    bullets: [
      "Switch between Week, Month and Year trend views",
      "Grouped bar chart compares income vs expenses per period",
      "Donut chart breaks down spending by category",
      "Filter the analysis to a specific category from the page header",
    ],
  },
  {
    icon: Briefcase,
    color: "#fbbf24",
    title: "Wealth — Investments & Loans",
    tagline: "Your full financial picture in one place",
    bullets: [
      "Log and track portfolios across Stocks, Mutual Funds, FDs, Crypto and more",
      "Log current value vs invested amount to see gain / loss at a glance",
      "Separate Loans section tracks outstanding balances and lender details",
      "Donut chart shows allocation across investment types",
      "Net-worth card totals accounts + (plus) investments - (minus) loans",
    ],
  },
  {
    icon: SlidersHorizontal,
    color: "#94a3b8",
    title: "Settings & Customization",
    tagline: "Make FinTrack truly yours",
    bullets: [
      "Set your display name and preferred currency symbol",
      "Toggle daily reminder notifications and pick the time",
      "Switch between Light and Dark themes",
      "Show or hide the weekly spending chart on the Home screen",
      "Set a default account so new transactions pre-fill it",
      "Create, edit or delete custom categories (Expense / Income / Transfer)",
      "Export your data as JSON for backup, or import a previous backup",
    ],
  },
];

function FeaturesModal({
  visible,
  onClose,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[fmStyles.root, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[fmStyles.header, { borderBottomColor: border }]}>
          <View style={fmStyles.headerLeft}>
            <BookOpen size={20} color="#34d399" />
            <Text style={[fmStyles.headerTitle, { color: textColor }]}>
              App Guide
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            style={[
              fmStyles.closeBtn,
              { backgroundColor: isDark ? "#2d2b5e" : "#f1f5f9" },
            ]}
          >
            <X size={18} color={subText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={fmStyles.scroll}
        >
          <Text style={[fmStyles.intro, { color: subText }]}>
            FinTrack is a fully offline personal finance tracker. Here's what
            every section of the app can do for you.
          </Text>

          {FEATURES.map(({ icon: Icon, color, title, tagline, bullets }) => (
            <View
              key={title}
              style={[
                fmStyles.card,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Card header */}
              <View style={fmStyles.cardHeader}>
                <View
                  style={[fmStyles.iconWrap, { backgroundColor: `${color}20` }]}
                >
                  <Icon size={20} color={color} />
                </View>
                <View style={fmStyles.cardTitleBlock}>
                  <Text style={[fmStyles.cardTitle, { color: textColor }]}>
                    {title}
                  </Text>
                  <Text style={[fmStyles.cardTagline, { color: subText }]}>
                    {tagline}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={[fmStyles.divider, { backgroundColor: border }]} />

              {/* Bullets */}
              {bullets.map((b, i) => (
                <View key={i} style={fmStyles.bulletRow}>
                  <View style={[fmStyles.bullet, { backgroundColor: color }]} />
                  <Text style={[fmStyles.bulletText, { color: subText }]}>
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const fmStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 20, fontFamily: F.heading },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { padding: 20 },
  intro: {
    fontSize: 13,
    fontFamily: F.body,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: F.title, marginBottom: 2 },
  cardTagline: { fontSize: 12, fontFamily: F.body },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 12 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  bulletText: { fontSize: 13, fontFamily: F.body, lineHeight: 19, flex: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

// ── Notification time presets ─────────────────────────────────────────────────

const NOTIF_TIMES = [
  { label: "7 AM", value: "07:00" },
  { label: "8 AM", value: "08:00" },
  { label: "9 AM", value: "09:00" },
  { label: "12 PM", value: "12:00" },
  { label: "6 PM", value: "18:00" },
  { label: "8 PM", value: "20:00" },
  { label: "10 PM", value: "22:00" },
];

type CatTab = "Expense" | "Income" | "Transfer";
const CAT_TABS: CatTab[] = ["Expense", "Income", "Transfer"];

const CAT_TAB_COLORS: Record<CatTab, string> = {
  Expense: "#ef4444",
  Income: "#34d399",
  Transfer: "#60a5fa",
};

const CAT_TAB_ICONS: Record<CatTab, React.ReactElement> = {
  Expense: <TrendingDown size={14} color="#ef4444" />,
  Income: <TrendingUp size={14} color="#34d399" />,
  Transfer: <ArrowLeftRight size={14} color="#60a5fa" />,
};

// ── Release notes (developer-editable) ──────────────────────────────────────
// Update this list whenever you ship a new build. End users see it read-only.
const RELEASE_NOTES: { version: string; fixes: string[] }[] = [
  {
    version: "v2.1.4",
    fixes: [
      "Widget support - preview and widget implementation for Android",
      "Bug fixes and performance improvements",
      "Analytics page style change - Added pie chart, month selector",
      "Settings page - Manage categories as separate page",
    ],
  },
];

const CAT_TAB_ACTIVE_ICONS: Record<CatTab, React.ReactElement> = {
  Expense: <TrendingDown size={14} color="#fff" />,
  Income: <TrendingUp size={14} color="#fff" />,
  Transfer: <ArrowLeftRight size={14} color="#fff" />,
};

export default function SettingsScreen() {
  const {
    accounts,
    categories,
    deleteCategory,
    config,
    updateConfig,
    exportData,
  } = useApp();
  const { showToast } = useToast();
  const { openSheet, closeSheet } = useBottomSheet();
  const router = useRouter();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const [catTab, setCatTab] = useState<CatTab>("Expense");
  const [catsExpanded, setCatsExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [userName, setUserName] = useState(config.userName ?? "");
  const [currencySymbol, setCurrencySymbol] = useState(
    config.currencySymbol ?? "₹",
  );

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === catTab),
    [categories, catTab],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddCategorySheet = () => {
    hapticLight();
    openSheet({
      isDark,
      children: <AddCategoryForm onClose={closeSheet} isDark={isDark} />,
    });
  };

  const openEditCategorySheet = (cat: Category) => {
    hapticLight();
    openSheet({
      isDark,
      children: (
        <EditCategoryForm category={cat} onClose={closeSheet} isDark={isDark} />
      ),
    });
  };

  const openImportSheet = () => {
    hapticLight();
    openSheet({
      isDark,
      children: <ImportSheet onClose={closeSheet} isDark={isDark} />,
    });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const filename = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "Save FinTrack Backup",
        UTI: "public.json",
      });
      hapticSuccess();
    } catch {
      hapticError();
      showToast("Export failed", "error");
    }
  };

  const handleDeleteCategory = (id: string) => {
    hapticLight();
    deleteCategory(id);
  };

  const handleUserNameSave = () => {
    hapticSuccess();
    updateConfig({ userName: userName.trim() });
    showToast("Name saved");
  };

  const handleCurrencySymbolSave = () => {
    hapticSuccess();
    updateConfig({ currencySymbol: currencySymbol.trim() || "₹" });
    showToast("Currency symbol saved");
  };

  const handleNotifToggle = async (enabled: boolean) => {
    hapticSelection();
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast("Notification permission denied", "error");
        return;
      }
      await scheduleDaily(config.notificationTime ?? "09:00");
    } else {
      await cancelScheduled();
    }
    updateConfig({ notificationsEnabled: enabled });
  };

  const handleNotifTime = async (time: string) => {
    hapticSelection();
    await updateConfig({ notificationTime: time });
    if (config.notificationsEnabled) {
      await scheduleDaily(time);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <FeaturesModal
        visible={showFeatures}
        onClose={() => setShowFeatures(false)}
        isDark={isDark}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: textColor }]}>Settings</Text>
        </View>

        {/* ── PROFILE ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>PROFILE</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <User size={18} color={subText} />
              <Text style={[styles.settingLabel, { color: textColor }]}>
                Your Name
              </Text>
            </View>
          </View>
          <View style={styles.nameInputRow}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: isDark ? "#0f0c29" : "#f1f5f9",
                  color: textColor,
                  borderColor: border,
                },
              ]}
              placeholder="e.g. Arjun"
              placeholderTextColor={subText}
              value={userName}
              onChangeText={setUserName}
              returnKeyType="done"
              onSubmitEditing={handleUserNameSave}
            />
            <TouchableOpacity
              style={styles.nameSaveBtn}
              onPress={handleUserNameSave}
              activeOpacity={0.8}
            >
              <Text style={styles.nameSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Coins size={18} color={subText} />
              <Text style={[styles.settingLabel, { color: textColor }]}>
                Currency Symbol
              </Text>
            </View>
          </View>
          <View style={styles.nameInputRow}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: isDark ? "#0f0c29" : "#f1f5f9",
                  color: textColor,
                  borderColor: border,
                },
              ]}
              placeholder="e.g. ₹, $, €"
              placeholderTextColor={subText}
              value={currencySymbol}
              onChangeText={setCurrencySymbol}
              returnKeyType="done"
              maxLength={4}
              onSubmitEditing={handleCurrencySymbolSave}
            />
            <TouchableOpacity
              style={styles.nameSaveBtn}
              onPress={handleCurrencySymbolSave}
              activeOpacity={0.8}
            >
              <Text style={styles.nameSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>
          NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {config.notificationsEnabled ? (
                <Bell size={18} color={subText} />
              ) : (
                <BellOff size={18} color={subText} />
              )}
              <Text style={[styles.settingLabel, { color: textColor }]}>
                Daily Reminder
              </Text>
            </View>
            <Switch
              value={config.notificationsEnabled ?? false}
              onValueChange={handleNotifToggle}
              trackColor={{ false: border, true: "#34d399" }}
              thumbColor="#fff"
            />
          </View>

          {config.notificationsEnabled && (
            <>
              <View style={[styles.rowDivider, { backgroundColor: border }]} />
              <Text
                style={[fStyles.label, { color: subText, marginHorizontal: 0 }]}
              >
                Reminder Time
              </Text>
              <View style={styles.timeChipRow}>
                {NOTIF_TIMES.map(({ label, value }) => {
                  const active = (config.notificationTime ?? "09:00") === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleNotifTime(value)}
                      style={[
                        styles.timeChip,
                        {
                          borderColor: "#34d399",
                          backgroundColor: active ? "#34d399" : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          { color: active ? "#0f172a" : subText },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── APPEARANCE ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {/* Theme toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={18} color={subText} />
              ) : (
                <Sun size={18} color={subText} />
              )}
              <Text style={[styles.settingLabel, { color: textColor }]}>
                Theme
              </Text>
            </View>
            <View
              style={[
                styles.themePill,
                { backgroundColor: isDark ? "#334155" : "#e2e8f0" },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  updateConfig({ theme: "light" });
                }}
                style={[
                  styles.themePillItem,
                  !isDark && { backgroundColor: "#ffffff" },
                ]}
              >
                <Sun size={13} color={!isDark ? "#1e293b" : subText} />
                <Text
                  style={[
                    styles.themePillText,
                    { color: !isDark ? "#1e293b" : subText },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  updateConfig({ theme: "dark" });
                }}
                style={[
                  styles.themePillItem,
                  isDark && { backgroundColor: "#1e293b" },
                ]}
              >
                <Moon size={13} color={isDark ? "#f1f5f9" : subText} />
                <Text
                  style={[
                    styles.themePillText,
                    { color: isDark ? "#f1f5f9" : subText },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          {/* Weekly spending chart toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {config.showWeeklySpendingChart ? (
                <EyeIcon size={18} color={subText} />
              ) : (
                <EyeOffIcon size={18} color={subText} />
              )}
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>
                  Weekly Spending Chart
                </Text>
                <Text style={[styles.settingSubLabel, { color: subText }]}>
                  Shows in home screen
                </Text>
              </View>
            </View>
            <Switch
              value={config.showWeeklySpendingChart}
              onValueChange={(v) => {
                hapticSelection();
                updateConfig({ showWeeklySpendingChart: v });
              }}
              trackColor={{ false: border, true: "#34d399" }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          {/* Default account */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => {
              hapticSelection();
              const currentIdx = accounts.findIndex(
                (a) => a.id === config.defaultAccountId,
              );
              let nextId: string | null;
              if (currentIdx === -1 || currentIdx === accounts.length - 1) {
                nextId = accounts[0]?.id ?? null;
              } else {
                nextId = accounts[currentIdx + 1].id;
              }
              updateConfig({ defaultAccountId: nextId });
            }}
          >
            <View style={styles.settingLeft}>
              <Landmark size={18} color={subText} />
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>
                  Default Account
                </Text>
                <Text style={[styles.settingSubLabel, { color: subText }]}>
                  Pre-fills account when adding transactions
                </Text>
              </View>
            </View>
            <View style={styles.defaultAccRight}>
              <Text
                style={[styles.defaultAccName, { color: "#34d399" }]}
                numberOfLines={1}
              >
                {config.defaultAccountId
                  ? (accounts.find((a) => a.id === config.defaultAccountId)
                      ?.name ?? "None")
                  : "None"}
              </Text>
              <ChevronRight size={15} color={subText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CATEGORIES ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>
          CATEGORIES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <TouchableOpacity
            style={styles.dataRow}
            onPress={() => {
              hapticLight();
              router.push("/settings/categories");
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.dataIconWrap, { backgroundColor: "#f59e0b18" }]}
            >
              <TagIcon size={18} color="#f59e0b" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>
                Manage Categories
              </Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Create, edit or delete custom categories
              </Text>
            </View>
            <ChevronRight size={16} color={subText} />
          </TouchableOpacity>
        </View>

        {/* ── DATA MANAGEMENT ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>
          DATA MANAGEMENT
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {/* Export */}
          <TouchableOpacity
            style={styles.dataRow}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <View
              style={[styles.dataIconWrap, { backgroundColor: "#34d39918" }]}
            >
              <Download size={18} color="#34d399" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>
                Export Backup
              </Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Share your data as JSON
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          {/* Import */}
          <TouchableOpacity
            style={styles.dataRow}
            onPress={openImportSheet}
            activeOpacity={0.7}
          >
            <View
              style={[styles.dataIconWrap, { backgroundColor: "#60a5fa18" }]}
            >
              <Upload size={18} color="#60a5fa" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>
                Import Backup
              </Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Restore from a JSON backup
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── ABOUT ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>ABOUT</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {/* App Guide */}
          <TouchableOpacity
            style={styles.dataRow}
            onPress={() => {
              hapticLight();
              setShowFeatures(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.dataIconWrap, { backgroundColor: "#34d39918" }]}
            >
              <BookOpen size={18} color="#34d399" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>
                App Guide
              </Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Walk-through of every feature
              </Text>
            </View>
            <ChevronRight size={16} color={subText} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          <TouchableOpacity
            style={styles.aboutRow}
            onPress={() => {
              hapticLight();
              setAboutExpanded((v) => !v);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.dataIconWrap, { backgroundColor: "#1e293b22" }]}
            >
              <Info size={18} color={subText} />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>
                FinTrack {RELEASE_NOTES[0].version}
              </Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Offline & Private · No cloud sync · Your data stays on-device.
              </Text>
            </View>
            <ChevronDown
              size={16}
              color={subText}
              style={{
                transform: [{ rotate: aboutExpanded ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {aboutExpanded && (
            <>
              <View style={[styles.rowDivider, { backgroundColor: border }]} />
              {RELEASE_NOTES.map(({ version, fixes }) => (
                <View key={version} style={styles.releaseBlock}>
                  <Text style={[styles.releaseVersion, { color: "#34d399" }]}>
                    {version} — What's fixed
                  </Text>
                  {fixes.map((fix, i) => (
                    <View key={i} style={styles.releaseFixRow}>
                      <View
                        style={[
                          styles.releaseDot,
                          { backgroundColor: subText },
                        ]}
                      />
                      <Text style={[styles.releaseFixText, { color: subText }]}>
                        {fix}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  pageHeader: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  pageTitle: { fontSize: 28, fontFamily: F.heading },

  sectionLabel: {
    fontSize: 11,
    fontFamily: F.semi,
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  card: {
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: F.semi },

  themePill: { flexDirection: "row", borderRadius: 10, padding: 3, gap: 2 },
  themePillItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  themePillText: { fontSize: 12, fontFamily: F.semi },

  rowDivider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },

  settingSubLabel: { fontSize: 11, fontFamily: F.body, marginTop: 1 },
  defaultAccRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 120,
  },
  defaultAccName: { fontSize: 13, fontFamily: F.semi },

  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardInnerTitle: { fontSize: 14, fontFamily: F.semi },
  addLink: { fontSize: 13, fontFamily: F.semi, color: "#34d399" },

  catTabBar: { flexDirection: "row", gap: 8, marginBottom: 14 },
  catTabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  catTabText: { fontSize: 13, fontFamily: F.semi },

  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  catIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  catPillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    flex: 1,
  },
  catPillBadgeText: { fontSize: 13, fontFamily: F.semi },
  categoriesAddRow: { alignItems: "flex-end", marginBottom: 10 },
  catActionBtn: { padding: 4 },
  emptyText: {
    fontSize: 13,
    fontFamily: F.body,
    paddingVertical: 8,
    textAlign: "center",
  },

  nameInputRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: F.body,
  },
  nameSaveBtn: {
    backgroundColor: "#34d399",
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  nameSaveBtnText: { fontSize: 13, fontFamily: F.semi, color: "#0f172a" },
  timeChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  timeChipText: { fontSize: 12, fontFamily: F.semi },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  dataIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dataInfo: { flex: 1 },
  dataLabel: { fontSize: 14, fontFamily: F.semi, marginBottom: 2 },
  dataSubLabel: { fontSize: 12, fontFamily: F.body, lineHeight: 17 },

  releaseBlock: { marginTop: 10 },
  releaseVersion: { fontSize: 12, fontFamily: F.semi, marginBottom: 8 },
  releaseFixRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  releaseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  releaseFixText: { fontSize: 12, fontFamily: F.body, lineHeight: 18, flex: 1 },
});
