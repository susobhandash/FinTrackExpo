import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Share,
  StatusBar,
  Alert,
} from "react-native";
import {
  Moon,
  Sun,
  Download,
  Upload,
  Tag,
  Plus,
  X,
  Pencil,
  Database,
  Info,
  TrendingDown,
  ArrowLeftRight,
  TrendingUp,
  EyeIcon,
  EyeOffIcon,
  Bell,
  BellOff,
  User,
} from "lucide-react-native";
import {
  requestNotificationPermission,
  scheduleDaily,
  cancelScheduled,
} from "@/utils/notifications";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { F } from "@/utils/fonts";
import { hapticSuccess, hapticError, hapticLight, hapticSelection } from "@/utils/haptics";
import type { Category } from "@/types";

// ── Color palette (shared) ────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#F87171", "#FB923C", "#FBBF24", "#A3E635",
  "#34D399", "#22D3EE", "#60A5FA", "#A78BFA",
  "#F472B6", "#94A3B8",
];

const TYPE_CONFIG: { value: Category["type"]; label: string; color: string }[] = [
  { value: "Expense",  label: "Expense",  color: "#ef4444" },
  { value: "Income",   label: "Income",   color: "#34d399" },
  { value: "Transfer", label: "Transfer", color: "#60a5fa" },
];

// ── Add Category Form ─────────────────────────────────────────────────────────

function AddCategoryForm({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { addCategory, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]                 = useState("");
  const [type, setType]                 = useState<Category["type"]>("Expense");
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
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
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
              onPress={() => { hapticSelection(); setType(value); }}
              style={[
                fStyles.typeChip,
                { borderColor: color },
                active && { backgroundColor: color },
              ]}
            >
              <Text style={[fStyles.typeChipText, { color: active ? "#fff" : color }]}>
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
            onPress={() => { hapticSelection(); setSelectedColor(color); }}
            style={[
              fStyles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && fStyles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
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
  const { updateCategory, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [name, setName]                 = useState(category.name);
  const [type, setType]                 = useState<Category["type"]>(category.type);
  const [selectedColor, setSelectedColor] = useState(
    COLOR_PALETTE.includes(category.color) ? category.color : COLOR_PALETTE[0]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      hapticError();
      showToast("Enter category name", "error");
      return;
    }
    await updateCategory({ ...category, name: name.trim(), type, color: selectedColor });
    hapticSuccess();
    showToast("Category updated");
    onClose();
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Edit Category</Text>

      <Text style={[fStyles.label, { color: subText }]}>Name</Text>
      <TextInput
        style={[fStyles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
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
              onPress={() => { hapticSelection(); setType(value); }}
              style={[
                fStyles.typeChip,
                { borderColor: color },
                active && { backgroundColor: color },
              ]}
            >
              <Text style={[fStyles.typeChipText, { color: active ? "#fff" : color }]}>
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
            onPress={() => { hapticSelection(); setSelectedColor(color); }}
            style={[
              fStyles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && fStyles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={fStyles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Import Sheet ──────────────────────────────────────────────────────────────

function ImportSheet({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { importData, showToast } = useApp();

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";
  const inputBg   = isDark ? "#0f0c29" : "#f1f5f9";

  const [json, setJson] = useState("");

  const handleImport = async () => {
    if (!json.trim()) {
      hapticError();
      showToast("Paste your backup JSON", "error");
      return;
    }
    try {
      const data = JSON.parse(json.trim());
      await importData(data);
      hapticSuccess();
      showToast("Data imported successfully");
      onClose();
    } catch {
      hapticError();
      showToast("Invalid JSON — please check your backup", "error");
    }
  };

  return (
    <View style={[fStyles.container, { backgroundColor: cardBg }]}>
      <Text style={[fStyles.title, { color: textColor }]}>Import Backup</Text>
      <Text style={[fStyles.instructionText, { color: subText }]}>
        Paste the JSON content from a previously exported FinTrack backup below.
        This will replace all existing data.
      </Text>

      <Text style={[fStyles.label, { color: subText }]}>Backup JSON</Text>
      <TextInput
        style={[
          fStyles.input,
          fStyles.jsonInput,
          { backgroundColor: inputBg, color: textColor, borderColor: border },
        ]}
        placeholder='{ "accounts": [], "transactions": [], ... }'
        placeholderTextColor={subText}
        multiline
        value={json}
        onChangeText={setJson}
        textAlignVertical="top"
      />

      <View style={fStyles.importBtnRow}>
        <TouchableOpacity
          style={[fStyles.cancelBtn, { borderColor: border }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={[fStyles.cancelBtnText, { color: subText }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={fStyles.saveBtn} onPress={handleImport} activeOpacity={0.85}>
          <Text style={fStyles.saveBtnText}>Import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Shared form styles ────────────────────────────────────────────────────────

const fStyles = StyleSheet.create({
  container: { padding: 20, borderRadius: 16 },
  title:     { fontSize: 18, fontFamily: F.title, marginBottom: 12 },
  label:     { fontSize: 12, fontFamily: F.semi, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: F.body,
    marginBottom: 4,
  },
  jsonInput:  { minHeight: 120, paddingTop: 10 },
  typeRow:    { flexDirection: "row", gap: 8, marginBottom: 4 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: F.semi },
  saveBtn: {
    flex: 1,
    marginTop: 0,
    backgroundColor: "#34d399",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText:     { fontSize: 15, fontFamily: F.semi, color: "#0f172a" },
  instructionText: { fontSize: 13, fontFamily: F.body, lineHeight: 20, marginBottom: 8 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

// ── Notification time presets ─────────────────────────────────────────────────

const NOTIF_TIMES = [
  { label: "7 AM",  value: "07:00" },
  { label: "8 AM",  value: "08:00" },
  { label: "9 AM",  value: "09:00" },
  { label: "12 PM", value: "12:00" },
  { label: "6 PM",  value: "18:00" },
  { label: "8 PM",  value: "20:00" },
  { label: "10 PM", value: "22:00" },
];

type CatTab = "Expense" | "Income" | "Transfer";
const CAT_TABS: CatTab[] = ["Expense", "Income", "Transfer"];

const CAT_TAB_COLORS: Record<CatTab, string> = {
  Expense:  "#ef4444",
  Income:   "#34d399",
  Transfer: "#60a5fa",
};

const CAT_TAB_ICONS: Record<CatTab, React.ReactElement> = {
  Expense:  <TrendingDown size={14} color="#ef4444" />,
  Income:   <TrendingUp   size={14} color="#34d399" />,
  Transfer: <ArrowLeftRight size={14} color="#60a5fa" />,
};

export default function SettingsScreen() {
  const { categories, deleteCategory, config, updateConfig, exportData, showToast } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark    = config.theme === "dark";
  const bg        = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText   = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d2b5e" : "#e2e8f0";

  const [catTab, setCatTab] = useState<CatTab>("Expense");
  const [userName, setUserName] = useState(config.userName ?? "");

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === catTab),
    [categories, catTab]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddCategorySheet = () => {
    hapticLight();
    openSheet({ isDark, children: <AddCategoryForm onClose={closeSheet} isDark={isDark} /> });
  };

  const openEditCategorySheet = (cat: Category) => {
    hapticLight();
    openSheet({
      isDark,
      children: <EditCategoryForm category={cat} onClose={closeSheet} isDark={isDark} />,
    });
  };

  const openImportSheet = () => {
    hapticLight();
    openSheet({ isDark, children: <ImportSheet onClose={closeSheet} isDark={isDark} /> });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({ title: "FinTrack Backup", message: json });
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
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <User size={18} color={subText} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Your Name</Text>
            </View>
          </View>
          <View style={styles.nameInputRow}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: isDark ? "#0f0c29" : "#f1f5f9", color: textColor, borderColor: border }]}
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
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {config.notificationsEnabled
                ? <Bell size={18} color={subText} />
                : <BellOff size={18} color={subText} />}
              <Text style={[styles.settingLabel, { color: textColor }]}>Daily Reminder</Text>
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
              <Text style={[fStyles.label, { color: subText, marginHorizontal: 0 }]}>Reminder Time</Text>
              <View style={styles.timeChipRow}>
                {NOTIF_TIMES.map(({ label, value }) => {
                  const active = (config.notificationTime ?? "09:00") === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleNotifTime(value)}
                      style={[
                        styles.timeChip,
                        { borderColor: "#34d399", backgroundColor: active ? "#34d399" : "transparent" },
                      ]}
                    >
                      <Text style={[styles.timeChipText, { color: active ? "#0f172a" : subText }]}>
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
        <Text style={[styles.sectionLabel, { color: subText }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {/* Theme toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {isDark ? <Moon size={18} color={subText} /> : <Sun size={18} color={subText} />}
              <Text style={[styles.settingLabel, { color: textColor }]}>Theme</Text>
            </View>
            <View style={[styles.themePill, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}>
              <TouchableOpacity
                onPress={() => { hapticSelection(); updateConfig({ theme: "light" }); }}
                style={[styles.themePillItem, !isDark && { backgroundColor: "#ffffff" }]}
              >
                <Sun size={13} color={!isDark ? "#1e293b" : subText} />
                <Text style={[styles.themePillText, { color: !isDark ? "#1e293b" : subText }]}>
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { hapticSelection(); updateConfig({ theme: "dark" }); }}
                style={[styles.themePillItem, isDark && { backgroundColor: "#1e293b" }]}
              >
                <Moon size={13} color={isDark ? "#f1f5f9" : subText} />
                <Text style={[styles.themePillText, { color: isDark ? "#f1f5f9" : subText }]}>
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
              <Text style={[styles.settingLabel, { color: textColor }]}>Weekly Spending Chart</Text>
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
        </View>

        {/* ── CATEGORIES ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>CATEGORIES</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {/* Header */}
          <View style={styles.categoriesHeader}>
            <Text style={[styles.cardInnerTitle, { color: textColor }]}>Manage Categories</Text>
            <TouchableOpacity onPress={openAddCategorySheet} hitSlop={8}>
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View style={styles.catTabBar}>
            {CAT_TABS.map((tab) => {
              const active = catTab === tab;
              const color  = CAT_TAB_COLORS[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => { hapticSelection(); setCatTab(tab); }}
                  style={[
                    styles.catTabChip,
                    { borderColor: color, backgroundColor: active ? color : `${color}18` },
                  ]}
                >
                  {CAT_TAB_ICONS[tab]}
                  <Text style={[styles.catTabText, { color: active ? "#fff" : color }]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category list */}
          {filteredCats.length === 0 ? (
            <Text style={[styles.emptyText, { color: subText }]}>
              No {catTab.toLowerCase()} categories
            </Text>
          ) : (
            filteredCats.map((cat, idx) => {
              const isLast = idx === filteredCats.length - 1;
              return (
                <View key={cat.id}>
                  <View style={styles.catRow}>
                    {/* Icon circle */}
                    <View style={[styles.catIconCircle, { backgroundColor: `${cat.color}22` }]}>
                      <Tag size={14} color={cat.color} />
                    </View>

                    {/* Pill badge */}
                    <View style={[styles.catPillBadge, { backgroundColor: cat.color }]}>
                      <Text style={styles.catPillBadgeText} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>

                    {/* Spacer */}
                    <View style={{ flex: 1 }} />

                    {/* Edit */}
                    <TouchableOpacity
                      onPress={() => openEditCategorySheet(cat)}
                      hitSlop={8}
                      style={styles.catActionBtn}
                    >
                      <Pencil size={14} color={subText} />
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(cat.id)}
                      hitSlop={8}
                      style={styles.catActionBtn}
                    >
                      <X size={15} color={subText} />
                    </TouchableOpacity>
                  </View>
                  {!isLast && (
                    <View style={[styles.rowDivider, { backgroundColor: border, marginHorizontal: 0 }]} />
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── DATA MANAGEMENT ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>DATA MANAGEMENT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {/* Export */}
          <TouchableOpacity style={styles.dataRow} onPress={handleExport} activeOpacity={0.7}>
            <View style={[styles.dataIconWrap, { backgroundColor: "#34d39918" }]}>
              <Download size={18} color="#34d399" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>Export Backup</Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>Share your data as JSON</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: border }]} />

          {/* Import */}
          <TouchableOpacity style={styles.dataRow} onPress={openImportSheet} activeOpacity={0.7}>
            <View style={[styles.dataIconWrap, { backgroundColor: "#60a5fa18" }]}>
              <Upload size={18} color="#60a5fa" />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>Import Backup</Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>Restore from a JSON backup</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── ABOUT ── */}
        <Text style={[styles.sectionLabel, { color: subText }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.aboutRow}>
            <View style={[styles.dataIconWrap, { backgroundColor: "#1e293b22" }]}>
              <Info size={18} color={subText} />
            </View>
            <View style={styles.dataInfo}>
              <Text style={[styles.dataLabel, { color: textColor }]}>FinTrack v1.0.0</Text>
              <Text style={[styles.dataSubLabel, { color: subText }]}>
                Offline & Private · No cloud sync · Your data stays on-device.
              </Text>
            </View>
          </View>
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
  pageTitle:  { fontSize: 28, fontFamily: F.heading },

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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingLeft:  { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
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

  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardInnerTitle: { fontSize: 14, fontFamily: F.semi },
  addLink:        { fontSize: 13, fontFamily: F.semi, color: "#34d399" },

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
    borderRadius: 12,
    maxWidth: 130,
  },
  catPillBadgeText: { fontSize: 13, fontFamily: F.semi, color: "#ffffff" },
  catActionBtn: { padding: 4 },
  emptyText: { fontSize: 13, fontFamily: F.body, paddingVertical: 8, textAlign: "center" },

  nameInputRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: F.body,
  },
  nameSaveBtn: {
    backgroundColor: "#34d399",
    borderRadius: 10,
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
  dataRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  aboutRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 4 },
  dataIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dataInfo:    { flex: 1 },
  dataLabel:   { fontSize: 14, fontFamily: F.semi, marginBottom: 2 },
  dataSubLabel: { fontSize: 12, fontFamily: F.body, lineHeight: 17 },
});
