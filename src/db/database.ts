import * as SQLite from "expo-sqlite";
import type {
  Account, Category, Transaction, Budget, Investment, Loan, AppConfig,
} from "../types";
import { DEFAULT_CONFIG, DEFAULT_CATEGORIES } from "../types";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("fintrack.db");
    await initializeSchema(db);
  }
  return db;
}

async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id      TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      balance TEXT NOT NULL DEFAULT '0',
      type    TEXT NOT NULL DEFAULT 'Bank',
      color   TEXT NOT NULL DEFAULT '0'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      type  TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#94a3b8'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id         TEXT PRIMARY KEY,
      type       TEXT NOT NULL,
      amount     TEXT NOT NULL,
      note       TEXT NOT NULL DEFAULT '',
      accountId  TEXT,
      categoryId TEXT,
      date       TEXT NOT NULL,
      isRecurring INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id         TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      amount     TEXT NOT NULL,
      month      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      type           TEXT NOT NULL DEFAULT 'MF',
      investedAmount TEXT NOT NULL DEFAULT '0',
      currentValue   TEXT NOT NULL DEFAULT '0',
      date           TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
      id         TEXT PRIMARY KEY,
      personName TEXT NOT NULL,
      amount     TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'lent',
      date       TEXT NOT NULL,
      note       TEXT NOT NULL DEFAULT '',
      settled    INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migration: add color column to accounts if missing (for existing installs)
  try {
    await db.execAsync("ALTER TABLE accounts ADD COLUMN color TEXT NOT NULL DEFAULT '0'");
  } catch { /* column already exists */ }

  // Seed default categories if none exist
  const count = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM categories"
  );
  if (count && count.n === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        "INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (?, ?, ?, ?)",
        [cat.id, cat.name, cat.type, cat.color]
      );
    }
  }
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<AppConfig> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_config WHERE key = 'app_config'"
  );
  if (row) {
    try { return { ...DEFAULT_CONFIG, ...JSON.parse(row.value) }; } catch { /* fallback */ }
  }
  return DEFAULT_CONFIG;
}

export async function setConfig(config: AppConfig): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO app_config (key, value) VALUES ('app_config', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [JSON.stringify(config)]
  );
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  return db.getAllAsync<Account>("SELECT * FROM accounts");
}

export async function insertAccount(a: Account): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO accounts (id, name, balance, type, color) VALUES (?, ?, ?, ?, ?)",
    [a.id, a.name, a.balance, a.type, a.color ?? "0"]
  );
}

export async function updateAccount(a: Account): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE accounts SET name=?, balance=?, type=?, color=? WHERE id=?",
    [a.name, a.balance, a.type, a.color ?? "0", a.id]
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM accounts WHERE id=?", [id]);
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>("SELECT * FROM categories");
}

export async function insertCategory(c: Category): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO categories (id, name, type, color) VALUES (?, ?, ?, ?)",
    [c.id, c.name, c.type, c.color]
  );
}

export async function updateCategory(c: Category): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE categories SET name=?, type=?, color=? WHERE id=?",
    [c.name, c.type, c.color, c.id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM categories WHERE id=?", [id]);
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
  return rows.map((r) => ({ ...r, isRecurring: r.isRecurring === 1 }));
}

export async function insertTransaction(t: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO transactions (id, type, amount, note, accountId, categoryId, date, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [t.id, t.type, t.amount, t.note ?? "", t.accountId ?? null, t.categoryId ?? null, t.date, t.isRecurring ? 1 : 0]
  );
}

export async function updateTransaction(t: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE transactions SET type=?, amount=?, note=?, accountId=?, categoryId=?, date=?, isRecurring=? WHERE id=?",
    [t.type, t.amount, t.note ?? "", t.accountId ?? null, t.categoryId ?? null, t.date, t.isRecurring ? 1 : 0, t.id]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM transactions WHERE id=?", [id]);
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function getAllBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  return db.getAllAsync<Budget>("SELECT * FROM budgets");
}

export async function upsertBudget(b: Budget): Promise<void> {
  const db = await getDatabase();
  // Delete existing budget for same category+month, then insert new
  await db.runAsync(
    "DELETE FROM budgets WHERE categoryId=? AND month=?",
    [b.categoryId, b.month]
  );
  await db.runAsync(
    "INSERT INTO budgets (id, categoryId, amount, month) VALUES (?, ?, ?, ?)",
    [b.id, b.categoryId, b.amount, b.month]
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM budgets WHERE id=?", [id]);
}

// ── Investments ───────────────────────────────────────────────────────────────

export async function getAllInvestments(): Promise<Investment[]> {
  const db = await getDatabase();
  return db.getAllAsync<Investment>("SELECT * FROM investments");
}

export async function insertInvestment(inv: Investment): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO investments (id, name, type, investedAmount, currentValue, date) VALUES (?, ?, ?, ?, ?, ?)",
    [inv.id, inv.name, inv.type, inv.investedAmount, inv.currentValue, inv.date]
  );
}

export async function updateInvestment(inv: Investment): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE investments SET name=?, type=?, investedAmount=?, currentValue=?, date=? WHERE id=?",
    [inv.name, inv.type, inv.investedAmount, inv.currentValue, inv.date, inv.id]
  );
}

export async function deleteInvestment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM investments WHERE id=?", [id]);
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export async function getAllLoans(): Promise<Loan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>("SELECT * FROM loans");
  return rows.map((r) => ({ ...r, settled: r.settled === 1 }));
}

export async function insertLoan(l: Loan): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO loans (id, personName, amount, type, date, note, settled) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [l.id, l.personName, l.amount, l.type, l.date, l.note ?? "", l.settled ? 1 : 0]
  );
}

export async function updateLoan(l: Loan): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE loans SET personName=?, amount=?, type=?, date=?, note=?, settled=? WHERE id=?",
    [l.personName, l.amount, l.type, l.date, l.note ?? "", l.settled ? 1 : 0, l.id]
  );
}

export async function deleteLoan(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM loans WHERE id=?", [id]);
}

// ── Export / Import ───────────────────────────────────────────────────────────

export async function exportAllData(): Promise<object> {
  const db = await getDatabase();
  const config = await getConfig();
  const [accounts, categories, transactions, budgets, investments, loans] = await Promise.all([
    db.getAllAsync<Account>("SELECT * FROM accounts"),
    db.getAllAsync<Category>("SELECT * FROM categories"),
    db.getAllAsync<any>("SELECT * FROM transactions"),
    db.getAllAsync<Budget>("SELECT * FROM budgets"),
    db.getAllAsync<Investment>("SELECT * FROM investments"),
    db.getAllAsync<any>("SELECT * FROM loans"),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    config: {
      userName: config.userName,
      defaultAccountId: config.defaultAccountId,
      currencySymbol: config.currencySymbol,
    },
    accounts,
    categories,
    transactions: transactions.map((t) => ({
      ...t,
      isRecurring: t.isRecurring === 1,
    })),
    budgets,
    investments,
    loans: loans.map((l) => ({ ...l, settled: l.settled === 1 })),
  };
}

export async function importAllData(data: any): Promise<void> {
  const db = await getDatabase();

  if (data.config) {
    const existing = await getConfig();
    await setConfig({
      ...existing,
      ...(data.config.userName !== undefined && {
        userName: data.config.userName,
      }),
      ...(data.config.defaultAccountId !== undefined && {
        defaultAccountId: data.config.defaultAccountId,
      }),
      ...(data.config.currencySymbol !== undefined && {
        currencySymbol: data.config.currencySymbol,
      }),
    });
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync(
      "DELETE FROM accounts; DELETE FROM categories; DELETE FROM transactions; DELETE FROM budgets; DELETE FROM investments; DELETE FROM loans;"
    );

    for (const a of data.accounts || []) {
      await db.runAsync(
        "INSERT OR IGNORE INTO accounts (id, name, balance, type, color) VALUES (?, ?, ?, ?, ?)",
        [a.id, a.name, a.balance ?? "0", a.type ?? "Bank", a.color ?? "0"]
      );
    }
    for (const c of data.categories || []) {
      await db.runAsync(
        "INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (?, ?, ?, ?)",
        [c.id, c.name, c.type, c.color ?? "#94a3b8"]
      );
    }
    for (const t of data.transactions || []) {
      await db.runAsync(
        "INSERT OR IGNORE INTO transactions (id, type, amount, note, accountId, categoryId, date, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [t.id, t.type ?? "Expense", t.amount ?? "0", t.note ?? "", t.accountId ?? null, t.categoryId ?? null, t.date ?? new Date().toISOString(), t.isRecurring ? 1 : 0]
      );
    }
    for (const b of data.budgets || []) {
      if (b.id && b.categoryId && b.amount && b.month) {
        await db.runAsync(
          "INSERT OR IGNORE INTO budgets (id, categoryId, amount, month) VALUES (?, ?, ?, ?)",
          [b.id, b.categoryId, b.amount, b.month]
        );
      }
    }
    for (const inv of data.investments || []) {
      await db.runAsync(
        "INSERT OR IGNORE INTO investments (id, name, type, investedAmount, currentValue, date) VALUES (?, ?, ?, ?, ?, ?)",
        [inv.id, inv.name, inv.type ?? "MF", String(inv.investedAmount ?? "0"), String(inv.currentValue ?? "0"), inv.date ?? new Date().toISOString()]
      );
    }
    for (const l of data.loans || []) {
      await db.runAsync(
        "INSERT OR IGNORE INTO loans (id, personName, amount, type, date, note, settled) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [l.id, l.personName, l.amount, l.type ?? "lent", l.date ?? new Date().toISOString(), l.note ?? "", l.settled ? 1 : 0]
      );
    }
  });
}
