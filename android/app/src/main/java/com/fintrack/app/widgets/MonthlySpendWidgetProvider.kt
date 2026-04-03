package com.fintrack.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle
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
      appWidgetManager.updateAppWidget(widgetId, buildViews(context, appWidgetManager, widgetId))
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
    appWidgetManager.updateAppWidget(appWidgetId, buildViews(context, appWidgetManager, appWidgetId))
  }

  override fun onEnabled(context: Context) {
    WidgetUpdateDispatcher.refreshAllWidgets(context)
  }

  private fun buildViews(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
  ): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_monthly_spend)
    val snapshot = WidgetSnapshotParser.parseMonthlySpend(WidgetStorage.getSnapshot(context))
    val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
    val maxRows = resolveMaxRows(options)
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
      Triple(R.id.widget_monthly_row_4, R.id.widget_monthly_name_4, R.id.widget_monthly_value_4),
      Triple(R.id.widget_monthly_row_5, R.id.widget_monthly_name_5, R.id.widget_monthly_value_5),
      Triple(R.id.widget_monthly_row_6, R.id.widget_monthly_name_6, R.id.widget_monthly_value_6),
    )

    rows.forEachIndexed { index, row ->
      val item = snapshot.categories.getOrNull(index)
      if (index >= maxRows || item == null) {
        views.setViewVisibility(row.first, View.GONE)
      } else {
        views.setViewVisibility(row.first, View.VISIBLE)
        views.setTextViewText(row.second, item.name)
        views.setTextViewText(row.third, item.amount)
      }
    }

    return views
  }

  private fun resolveMaxRows(options: Bundle): Int {
    val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)
    return if (minHeight in 1..80) 2 else 6
  }
}
