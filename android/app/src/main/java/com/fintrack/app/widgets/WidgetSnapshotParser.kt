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

  fun parseIncomeExpense(snapshotJson: String?): IncomeExpenseData? {
    if (snapshotJson.isNullOrBlank()) return null
    return runCatching {
      val root = JSONObject(snapshotJson)
      val incomeExpense = root.getJSONObject("incomeExpense")
      IncomeExpenseData(
        periodLabel = incomeExpense.optString("periodLabel", "This month"),
        income = incomeExpense.optString("incomeFormatted", ""),
        expense = incomeExpense.optString("expenseFormatted", ""),
        net = incomeExpense.optString("netFormatted", ""),
      )
    }.getOrNull()
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
