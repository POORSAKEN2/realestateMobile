import type { Expense } from "../../types/domain/expenses";

export type ExpenseCategoryTotal = {
  category: string;
  total: number;
};

export type MonthlyExpenseSummary = {
  categoryTotals: ExpenseCategoryTotal[];
  monthLabel: string;
  total: number;
};

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function normalizeCategory(category: string) {
  const value = category.trim().toUpperCase();

  if (value.includes("MAINTENANCE")) return "MAINTENANCE";
  if (value.includes("UTILIT")) return "UTILITIES";
  if (value.includes("TAX")) return "TAXES";
  if (value.includes("INSURANCE")) return "INSURANCE";
  if (value.includes("MANAGEMENT")) return "MANAGEMENT_FEES";
  return value || "OTHER";
}

export function formatExpenseCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getMonthlyExpenseSummary(
  expenses: Expense[],
  referenceDate = new Date(),
): MonthlyExpenseSummary {
  const monthKey = getMonthKey(referenceDate);
  const totalsByCategory = new Map<string, number>();
  let total = 0;

  for (const expense of expenses) {
    if (expense.status === "Cancelled" || !expense.date.startsWith(monthKey)) {
      continue;
    }

    const amount = Number(expense.amount);
    if (!Number.isFinite(amount)) continue;

    const category = normalizeCategory(expense.category);
    total += amount;
    totalsByCategory.set(
      category,
      (totalsByCategory.get(category) ?? 0) + amount,
    );
  }

  return {
    categoryTotals: [...totalsByCategory]
      .map(([category, categoryTotal]) => ({
        category,
        total: categoryTotal,
      }))
      .sort(
        (left, right) =>
          right.total - left.total ||
          left.category.localeCompare(right.category),
      ),
    monthLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(referenceDate),
    total,
  };
}
