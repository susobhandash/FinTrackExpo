package com.fintrack.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.fintrack.app.R

class MonthlySpendWidgetProvider : AppWidgetProvider() {
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
    val views = RemoteViews(context.packageName, R.layout.widget_monthly_spend)
    val snapshot = WidgetSnapshotParser.parseMonthlySpend(WidgetStorage.getSnapshot(context))
    val openAnalytics = WidgetUpdateDispatcher.createDeepLinkPendingIntent(
      context,
      "fintrack://analytics?widget=monthly-spend",
      101,
    )

    views.setOnClickPendingIntent(R.id.widget_monthly_root, openAnalytics)

    if (snapshot == null) {
      views.setViewVisibility(R.id.widget_monthly_empty, View.VISIBLE)
      views.setViewVisibility(R.id.widget_monthly_category_list, View.GONE)
      return views
    }

    views.setViewVisibility(R.id.widget_monthly_empty, View.GONE)
    views.setViewVisibility(R.id.widget_monthly_category_list, View.VISIBLE)
    views.setTextViewText(R.id.widget_monthly_label, snapshot.monthLabel)
    views.setTextViewText(R.id.widget_monthly_amount, snapshot.totalSpent)

    val rows = listOf(
      Triple(R.id.widget_monthly_row_1, R.id.widget_monthly_name_1, R.id.widget_monthly_value_1),
      Triple(R.id.widget_monthly_row_2, R.id.widget_monthly_name_2, R.id.widget_monthly_value_2),
      Triple(R.id.widget_monthly_row_3, R.id.widget_monthly_name_3, R.id.widget_monthly_value_3),
    )

    rows.forEachIndexed { index, row ->
      val item = snapshot.categories.getOrNull(index)
      if (item == null) {
        views.setViewVisibility(row.first, View.GONE)
      } else {
        views.setViewVisibility(row.first, View.VISIBLE)
        views.setTextViewText(row.second, item.name)
        views.setTextViewText(row.third, item.amount)
      }
    }

    return views
  }
}
