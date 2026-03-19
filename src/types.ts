// ── Data Models ───────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  balance: string;
  type: "Bank" | "Cash" | "Wallet" | "Credit";
  color?: string; // gradient pair index as string "0"–"7"
}

export interface Category {
  id: string;
  name: string;
  type: "Expense" | "Income" | "Transfer";
  color: string;
}

export interface Transaction {
  id: string;
  type: "Expense" | "Income" | "Transfer";
  amount: string;
  note: string;
  accountId: string | null;
  categoryId: string | null;
  date: string;
  isRecurring: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: string;
  month: string; // "YYYY-MM"
}

export interface Investment {
  id: string;
  name: string;
  type: "MF" | "Stocks" | "FD" | "Gold" | "SIP" | "PF" | "NPS" | "Other";
  investedAmount: string;
  currentValue: string;
  date: string;
}

export interface Loan {
  id: string;
  personName: string;
  amount: string;
  type: "lent" | "borrowed";
  date: string;
  note: string;
  settled: boolean;
}

export interface AppConfig {
  theme: "light" | "dark";
  showWeeklySpendingChart: boolean;
  userName: string;
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:MM"
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  theme: "dark",
  showWeeklySpendingChart: true,
  userName: "",
  notificationsEnabled: false,
  notificationTime: "09:00",
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Food", type: "Expense", color: "#F87171" },
  { id: "2", name: "Shopping", type: "Expense", color: "#FB923C" },
  { id: "3", name: "Transport", type: "Expense", color: "#FBBF24" },
  { id: "4", name: "Bills", type: "Expense", color: "#A78BFA" },
  { id: "5", name: "Health", type: "Expense", color: "#F472B6" },
  { id: "6", name: "Entertainment", type: "Expense", color: "#60A5FA" },
  { id: "7", name: "Salary", type: "Income", color: "#4ADE80" },
  { id: "8", name: "Freelance", type: "Income", color: "#34D399" },
  { id: "9", name: "Investment Returns", type: "Income", color: "#2DD4BF" },
  { id: "10", name: "Internal", type: "Transfer", color: "#6A5ACD" },
];

export const ACCOUNT_TYPES: Account["type"][] = ["Bank", "Cash", "Wallet", "Credit"];

export const INVESTMENT_TYPES: Investment["type"][] = [
  "MF", "Stocks", "FD", "Gold", "SIP", "PF", "NPS", "Other"
];

export const INVESTMENT_TYPE_COLORS: Record<string, string> = {
  MF: "#6366F1",
  Stocks: "#F59E0B",
  FD: "#10B981",
  Gold: "#D97706",
  SIP: "#8B5CF6",
  PF: "#3B82F6",
  NPS: "#EC4899",
  Other: "#94A3B8",
};

export const ACCOUNT_GRADIENT_PAIRS: [string, string][] = [
  ["#667EEA", "#764BA2"],
  ["#43E97B", "#38F9D7"],
  ["#FA709A", "#FEE140"],
  ["#4481EB", "#04BEFE"],
  ["#F093FB", "#F5576C"],
  ["#4FACFE", "#00F2FE"],
  ["#43CFFA", "#7367F0"],
  ["#FF9A9E", "#FECFEF"],
];
