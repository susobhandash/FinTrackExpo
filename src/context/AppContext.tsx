import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import type {
  Account, Category, Transaction, Budget, Investment, Loan, AppConfig,
} from "../types";
import { DEFAULT_CONFIG } from "../types";
import * as DB from "../db/database";

// ── Toast state ───────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: "success" | "error";
}

// ── Context type ──────────────────────────────────────────────────────────────

interface AppContextType {
  // Data
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  investments: Investment[];
  loans: Loan[];
  config: AppConfig;
  toast: ToastState | null;
  loading: boolean;

  // Account actions
  addAccount: (a: Omit<Account, "id">) => Promise<void>;
  updateAccount: (a: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Category actions
  addCategory: (c: Omit<Category, "id">) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Transaction actions
  addTransaction: (t: Omit<Transaction, "id">, skipBalanceUpdate?: boolean) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget actions
  addBudget: (b: Omit<Budget, "id">) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Investment actions
  addInvestment: (inv: Omit<Investment, "id">) => Promise<void>;
  updateInvestment: (inv: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  // Loan actions
  addLoan: (l: Omit<Loan, "id" | "settled">) => Promise<void>;
  settleLoan: (id: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;

  // Config actions
  updateConfig: (patch: Partial<AppConfig>) => Promise<void>;

  // Utils
  showToast: (message: string, type?: "success" | "error") => void;
  reloadData: () => Promise<void>;
  exportData: () => Promise<object>;
  importData: (data: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transactionsRef = useRef<Transaction[]>([]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, type });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const reloadData = useCallback(async () => {
    const [acc, cat, tx, bud, inv, lns, cfg] = await Promise.all([
      DB.getAllAccounts(),
      DB.getAllCategories(),
      DB.getAllTransactions(),
      DB.getAllBudgets(),
      DB.getAllInvestments(),
      DB.getAllLoans(),
      DB.getConfig(),
    ]);
    setAccounts(acc);
    setCategories(cat);
    setTransactions(tx);
    setBudgets(bud);
    setInvestments(inv);
    setLoans(lns);
    setConfig(cfg);
  }, []);

  useEffect(() => {
    (async () => {
      try { await reloadData(); } finally { setLoading(false); }
    })();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [reloadData]);

  // ── Account actions ─────────────────────────────────────────────────────────

  const addAccount = useCallback(async (a: Omit<Account, "id">) => {
    const newAcc: Account = { ...a, id: Date.now().toString() };
    await DB.insertAccount(newAcc);
    setAccounts((prev) => [...prev, newAcc]);
  }, []);

  const updateAccount = useCallback(async (a: Account) => {
    await DB.updateAccount(a);
    setAccounts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    await DB.deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Category actions ────────────────────────────────────────────────────────

  const addCategory = useCallback(async (c: Omit<Category, "id">) => {
    const newCat: Category = { ...c, id: Date.now().toString() };
    await DB.insertCategory(newCat);
    setCategories((prev) => [...prev, newCat]);
  }, []);

  const updateCategory = useCallback(async (c: Category) => {
    await DB.updateCategory(c);
    setCategories((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await DB.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Transaction actions ─────────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id">, skipBalanceUpdate = false) => {
      const newTx: Transaction = {
        ...t,
        id: Date.now().toString(),
        date: t.date || new Date().toISOString(),
      };
      await DB.insertTransaction(newTx);

      // Update account balance
      if (!skipBalanceUpdate) {
        if (newTx.type === "Transfer" && newTx.accountId && newTx.toAccountId) {
          const amt = parseFloat(newTx.amount);
          setAccounts((prev) =>
            prev.map((acc) => {
              if (acc.id === newTx.accountId) {
                const updated: Account = {
                  ...acc,
                  balance: (parseFloat(acc.balance) - amt).toString(),
                };
                DB.updateAccount(updated);
                return updated;
              }
              if (acc.id === newTx.toAccountId) {
                const updated: Account = {
                  ...acc,
                  balance: (parseFloat(acc.balance) + amt).toString(),
                };
                DB.updateAccount(updated);
                return updated;
              }
              return acc;
            }),
          );
        } else if (newTx.accountId) {
          setAccounts((prev) =>
            prev.map((acc) => {
              if (acc.id !== newTx.accountId) return acc;
              const amt = parseFloat(newTx.amount);
              const newBal =
                newTx.type === "Expense"
                  ? parseFloat(acc.balance) - amt
                  : parseFloat(acc.balance) + amt;
              const updated: Account = { ...acc, balance: newBal.toString() };
              DB.updateAccount(updated);
              return updated;
            }),
          );
        }
      }

      setTransactions((prev) => [newTx, ...prev]);
    },
    []
  );

  const updateTransaction = useCallback(async (newTx: Transaction) => {
    const oldTx = transactionsRef.current.find((x) => x.id === newTx.id);
    await DB.updateTransaction(newTx);

    // Reconcile account balances: reverse old impact, apply new impact
    setAccounts((prev) => {
      let updated = [...prev];

      // Step 1: reverse the old transaction's impact
      if (oldTx?.type === "Transfer") {
        if (oldTx.accountId) {
          updated = updated.map((acc) => {
            if (acc.id !== oldTx.accountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) + parseFloat(oldTx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
        if (oldTx.toAccountId) {
          updated = updated.map((acc) => {
            if (acc.id !== oldTx.toAccountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) - parseFloat(oldTx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
      } else if (oldTx?.accountId) {
        updated = updated.map((acc) => {
          if (acc.id !== oldTx.accountId) return acc;
          const amt = parseFloat(oldTx.amount);
          const newBal =
            oldTx.type === "Expense"
              ? parseFloat(acc.balance) + amt // undo expense: add back
              : parseFloat(acc.balance) - amt; // undo income: subtract
          const result = { ...acc, balance: newBal.toString() };
          DB.updateAccount(result);
          return result;
        });
      }

      // Step 2: apply the new transaction's impact
      if (newTx.type === "Transfer") {
        if (newTx.accountId) {
          updated = updated.map((acc) => {
            if (acc.id !== newTx.accountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) - parseFloat(newTx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
        if (newTx.toAccountId) {
          updated = updated.map((acc) => {
            if (acc.id !== newTx.toAccountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) + parseFloat(newTx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
      } else if (newTx.accountId) {
        updated = updated.map((acc) => {
          if (acc.id !== newTx.accountId) return acc;
          const amt = parseFloat(newTx.amount);
          const newBal =
            newTx.type === "Expense"
              ? parseFloat(acc.balance) - amt
              : parseFloat(acc.balance) + amt;
          const result = { ...acc, balance: newBal.toString() };
          DB.updateAccount(result);
          return result;
        });
      }

      return updated;
    });

    setTransactions((prev) => prev.map((x) => (x.id === newTx.id ? newTx : x)));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactionsRef.current.find((t) => t.id === id);
    await DB.deleteTransaction(id);

    // Reverse the deleted transaction's impact on the account
    if (tx?.type === "Transfer") {
      setAccounts((prev) => {
        let updated = [...prev];
        if (tx.accountId) {
          updated = updated.map((acc) => {
            if (acc.id !== tx.accountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) + parseFloat(tx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
        if (tx.toAccountId) {
          updated = updated.map((acc) => {
            if (acc.id !== tx.toAccountId) return acc;
            const result = {
              ...acc,
              balance: (
                parseFloat(acc.balance) - parseFloat(tx.amount)
              ).toString(),
            };
            DB.updateAccount(result);
            return result;
          });
        }
        return updated;
      });
    } else if (tx?.accountId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== tx.accountId) return acc;
          const amt = parseFloat(tx.amount);
          const newBal =
            tx.type === "Expense"
              ? parseFloat(acc.balance) + amt // undo expense: add back
              : parseFloat(acc.balance) - amt; // undo income: subtract
          const result = { ...acc, balance: newBal.toString() };
          DB.updateAccount(result);
          return result;
        }),
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Budget actions ──────────────────────────────────────────────────────────

  const addBudget = useCallback(async (b: Omit<Budget, "id">) => {
    const newBudget: Budget = { ...b, id: Date.now().toString() };
    await DB.upsertBudget(newBudget);
    setBudgets((prev) => [
      ...prev.filter(
        (x) => !(x.categoryId === b.categoryId && x.month === b.month)
      ),
      newBudget,
    ]);
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    await DB.deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Investment actions ──────────────────────────────────────────────────────

  const addInvestment = useCallback(async (inv: Omit<Investment, "id">) => {
    const newInv: Investment = { ...inv, id: Date.now().toString() };
    await DB.insertInvestment(newInv);
    setInvestments((prev) => [...prev, newInv]);
  }, []);

  const updateInvestment = useCallback(async (inv: Investment) => {
    await DB.updateInvestment(inv);
    setInvestments((prev) => prev.map((x) => (x.id === inv.id ? inv : x)));
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    await DB.deleteInvestment(id);
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Loan actions ────────────────────────────────────────────────────────────

  const addLoan = useCallback(async (l: Omit<Loan, "id" | "settled">) => {
    const newLoan: Loan = { ...l, id: Date.now().toString(), settled: false };
    await DB.insertLoan(newLoan);
    setLoans((prev) => [...prev, newLoan]);
  }, []);

  const settleLoan = useCallback(async (id: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, settled: true };
        DB.updateLoan(updated);
        return updated;
      })
    );
  }, []);

  const deleteLoan = useCallback(async (id: string) => {
    await DB.deleteLoan(id);
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // ── Config actions ──────────────────────────────────────────────────────────

  const updateConfig = useCallback(
    async (patch: Partial<AppConfig>) => {
      const newConfig = { ...config, ...patch };
      await DB.setConfig(newConfig);
      setConfig(newConfig);
    },
    [config]
  );

  // ── Export / Import ─────────────────────────────────────────────────────────

  const exportData = useCallback(async () => DB.exportAllData(), []);

  const importData = useCallback(async (data: any) => {
    await DB.importAllData(data);
    await reloadData();
  }, [reloadData]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        accounts, categories, transactions, budgets, investments, loans, config,
        toast, loading,
        addAccount, updateAccount, deleteAccount,
        addCategory, updateCategory, deleteCategory,
        addTransaction, updateTransaction, deleteTransaction,
        addBudget, deleteBudget,
        addInvestment, updateInvestment, deleteInvestment,
        addLoan, settleLoan, deleteLoan,
        updateConfig,
        showToast, reloadData, exportData, importData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
