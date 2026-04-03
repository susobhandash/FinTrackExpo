package com.fintrack.app.widgets

import org.json.JSONArray
import org.json.JSONObject

data class CategorySlice(
  val name: String,
  val amount: String,
)

data class MonthlySpendData(
  val monthLabel: String,
  val totalSpent: String,
  val categories: List<CategorySlice>,
)

data class IncomeExpenseData(
  val periodLabel: String,
  val income: String,
  val expense: String,
  val net: String,
)

object WidgetSnapshotParser {
  private fun defaultIncomeExpenseData() = IncomeExpenseData(
    periodLabel = "This month",
    income = "₹0",
    expense = "₹0",
    net = "₹0",
  )

  fun parseMonthlySpend(snapshotJson: String?): MonthlySpendData? {
    if (snapshotJson.isNullOrBlank()) return null
    return runCatching {
      val root = JSONObject(snapshotJson)
      val monthly = root.getJSONObject("monthlySpend")
      MonthlySpendData(
        monthLabel = monthly.optString("monthLabel", "This month"),
        totalSpent = monthly.optString("totalSpentFormatted", ""),
        categories = parseCategories(monthly.optJSONArray("topCategories")),
      )
    }.getOrNull()
  }

  fun parseIncomeExpense(snapshotJson: String?): IncomeExpenseData {
    if (snapshotJson.isNullOrBlank()) return defaultIncomeExpenseData()
    return runCatching {
      val root = JSONObject(snapshotJson)
      val incomeExpense = root.optJSONObject("incomeExpense") ?: return@runCatching defaultIncomeExpenseData()
      IncomeExpenseData(
        periodLabel = incomeExpense.optString("periodLabel", "This month"),
        income = incomeExpense.optString("incomeFormatted", "₹0"),
        expense = incomeExpense.optString("expenseFormatted", "₹0"),
        net = incomeExpense.optString("netFormatted", "₹0"),
      )
    }.getOrDefault(defaultIncomeExpenseData())
  }

  private fun parseCategories(array: JSONArray?): List<CategorySlice> {
    if (array == null) return emptyList()
    return buildList {
      for (index in 0 until minOf(array.length(), 3)) {
        val item = array.optJSONObject(index) ?: continue
        add(
          CategorySlice(
            name = item.optString("name", "Category"),
            amount = item.optString("amountFormatted", ""),
          ),
        )
      }
    }
  }
}
