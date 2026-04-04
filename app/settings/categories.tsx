import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowLeftRight,
  Pencil,
  TagIcon,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useBottomSheet } from "@/context/BottomSheetContext";
import { useToast } from "@/context/ToastContext";
import { F } from "@/utils/fonts";
import {
  hapticError,
  hapticLight,
  hapticSelection,
  hapticSuccess,
} from "@/utils/haptics";
import type { Category } from "@/types";

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

const CAT_TAB_ACTIVE_ICONS: Record<CatTab, React.ReactElement> = {
  Expense: <TrendingDown size={14} color="#fff" />,
  Income: <TrendingUp size={14} color="#fff" />,
  Transfer: <ArrowLeftRight size={14} color="#fff" />,
};

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

export default function CategoriesScreen() {
  const { categories, deleteCategory, config } = useApp();
  const { openSheet, closeSheet } = useBottomSheet();

  const isDark = config.theme === "dark";
  const bg = isDark ? "#0f0c29" : "#f8fafc";
  const cardBg = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2b5e" : "#e2e8f0";

  const [catTab, setCatTab] = useState<CatTab>("Expense");

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === catTab),
    [categories, catTab],
  );

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

  const handleDeleteCategory = (id: string) => {
    hapticLight();
    deleteCategory(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.back();
            }}
            style={[styles.backBtn, { borderColor: border, backgroundColor: cardBg }]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={textColor} />
          </TouchableOpacity>

          <View style={styles.headerTextBlock}>
            <Text style={[styles.pageTitle, { color: textColor }]}>
              Manage Categories
            </Text>
            <Text style={[styles.pageSubtitle, { color: subText }]}>
              Create, edit, and organize your expense, income, and transfer labels.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subText }]}>CATEGORIES</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.categoriesAddRow}>
            <TouchableOpacity onPress={openAddCategorySheet} hitSlop={8}>
              <Text style={styles.addLink}>+ Add Category</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.catTabBar}>
            {CAT_TABS.map((tab) => {
              const active = catTab === tab;
              const color = CAT_TAB_COLORS[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    hapticSelection();
                    setCatTab(tab);
                  }}
                  style={[
                    styles.catTabChip,
                    {
                      borderColor: color,
                      backgroundColor: active ? color : `${color}18`,
                    },
                  ]}
                >
                  {active ? CAT_TAB_ACTIVE_ICONS[tab] : CAT_TAB_ICONS[tab]}
                  <Text
                    style={[
                      styles.catTabText,
                      { color: active ? "#fff" : color },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: `${cat.color}22` },
                      ]}
                    >
                      <TagIcon size={14} color={cat.color} />
                    </View>

                    <View style={styles.catPillBadge}>
                      <Text
                        style={[styles.catPillBadgeText, { color: cat.color }]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => openEditCategorySheet(cat)}
                      hitSlop={8}
                      style={styles.catActionBtn}
                    >
                      <Pencil size={14} color={subText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(cat.id)}
                      hitSlop={8}
                      style={styles.catActionBtn}
                    >
                      <X size={15} color={subText} />
                    </TouchableOpacity>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: border, marginHorizontal: 0 },
                      ]}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { padding: 18, borderRadius: 20 },
  title: { fontSize: 20, fontFamily: F.heading, marginBottom: 14 },
  label: { fontSize: 12, fontFamily: F.semi, marginBottom: 8, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: F.body,
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipText: { fontSize: 13, fontFamily: F.semi },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 4 },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: "#34d399",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontFamily: F.semi, color: "#0f172a" },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: { flex: 1 },
  pageTitle: { fontSize: 28, fontFamily: F.heading },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: F.body,
    lineHeight: 19,
    marginTop: 6,
  },
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
  rowDivider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  addLink: { fontSize: 13, fontFamily: F.semi, color: "#34d399" },
  categoriesAddRow: { alignItems: "flex-end", marginBottom: 10 },
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
  catActionBtn: { padding: 4 },
  emptyText: {
    fontSize: 13,
    fontFamily: F.body,
    paddingVertical: 8,
    textAlign: "center",
  },
});
