import { NativeModules, Platform } from "react-native";

import type { AppConfig, Category, Transaction } from "@/types";

type WidgetBridgeModule = {
  setWidgetSnapshot?: (snapshotJson: string) => Promise<void>;
  refreshWidgets?: () => void;
};

const widgetBridge: WidgetBridgeModule = NativeModules.WidgetBridge ?? {};

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatAmount(amount: number, currencySymbol: string): string {
  return `${currencySymbol}${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export async function syncAndroidWidgets(params: {
  transactions: Transaction[];
  categories: Category[];
  config: AppConfig;
}): Promise<void> {
  if (Platform.OS !== "android" || !widgetBridge.setWidgetSnapshot) return;

  const { transactions, categories, config } = params;
  const now = new Date();
  const monthKey = getMonthKey(now);
  const currencySymbol = config.currencySymbol ?? "₹";

  let income = 0;
  let expense = 0;
  const categoryTotals: Record<string, number> = {};

  transactions.forEach((transaction) => {
    if (getMonthKey(new Date(transaction.date)) !== monthKey) return;

    const amount = parseFloat(transaction.amount) || 0;

    if (transaction.type === "Income") {
      income += amount;
    }

    if (transaction.type === "Expense") {
      expense += amount;
      if (transaction.categoryId) {
        categoryTotals[transaction.categoryId] =
          (categoryTotals[transaction.categoryId] || 0) + amount;
      }
    }
  });

  const topCategories = Object.entries(categoryTotals)
    .map(([categoryId, amount]) => ({
      category: categories.find((item) => item.id === categoryId),
      amount,
    }))
    .filter((item) => item.category)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3)
    .map((item) => ({
      name: item.category!.name,
      color: item.category!.color,
      amount: item.amount,
      amountFormatted: formatAmount(item.amount, currencySymbol),
    }));

  const snapshot = {
    monthlySpend: {
      monthKey,
      monthLabel: now.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
      totalSpent: expense,
      totalSpentFormatted: formatAmount(expense, currencySymbol),
      topCategories,
    },
    incomeExpense: {
      periodLabel: "This month",
      income,
      incomeFormatted: formatAmount(income, currencySymbol),
      expense,
      expenseFormatted: formatAmount(expense, currencySymbol),
      net: income - expense,
      netFormatted: formatAmount(income - expense, currencySymbol),
    },
    meta: {
      currencySymbol,
      updatedAt: new Date().toISOString(),
    },
  };

  await widgetBridge.setWidgetSnapshot(JSON.stringify(snapshot));
}
