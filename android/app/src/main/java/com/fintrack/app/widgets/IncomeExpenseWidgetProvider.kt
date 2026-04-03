package com.fintrack.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.fintrack.app.R

class IncomeExpenseWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    appWidgetIds.forEach { widgetId ->
      appWidgetManager.updateAppWidget(widgetId, buildViews(context))
    }
  }

  override fun onEnabled(context: Context) {
    WidgetUpdateDispatcher.refreshAllWidgets(context)
  }

  private fun buildViews(context: Context): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_income_expense)
    val snapshot = WidgetSnapshotParser.parseIncomeExpense(WidgetStorage.getSnapshot(context))
    val openAnalytics = WidgetUpdateDispatcher.createDeepLinkPendingIntent(
      context,
      "fintrack://analytics?widget=income-expense",
      201,
    )

    views.setOnClickPendingIntent(R.id.widget_income_root, openAnalytics)

    if (snapshot == null) {
      views.setViewVisibility(R.id.widget_income_empty, View.VISIBLE)
      views.setViewVisibility(R.id.widget_income_content, View.GONE)
      return views
    }

    views.setViewVisibility(R.id.widget_income_empty, View.GONE)
    views.setViewVisibility(R.id.widget_income_content, View.VISIBLE)
    views.setTextViewText(R.id.widget_income_period, snapshot.periodLabel)
    views.setTextViewText(R.id.widget_income_value, snapshot.income)
    views.setTextViewText(R.id.widget_expense_value, snapshot.expense)
    views.setTextViewText(R.id.widget_net_value, snapshot.net)
    return views
  }
}
