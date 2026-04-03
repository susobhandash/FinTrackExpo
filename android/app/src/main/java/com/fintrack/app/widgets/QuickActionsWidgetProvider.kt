package com.fintrack.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.fintrack.app.R

class QuickActionsWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    appWidgetIds.forEach { widgetId ->
      val views = RemoteViews(context.packageName, R.layout.widget_quick_actions)
      views.setOnClickPendingIntent(
        R.id.widget_action_expense,
        WidgetUpdateDispatcher.createDeepLinkPendingIntent(
          context,
          "fintrack://?action=expense",
          301,
        ),
      )
      views.setOnClickPendingIntent(
        R.id.widget_action_income,
        WidgetUpdateDispatcher.createDeepLinkPendingIntent(
          context,
          "fintrack://?action=income",
          302,
        ),
      )
      views.setOnClickPendingIntent(
        R.id.widget_action_transfer,
        WidgetUpdateDispatcher.createDeepLinkPendingIntent(
          context,
          "fintrack://?action=transfer",
          303,
        ),
      )
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }

  override fun onEnabled(context: Context) {
    WidgetUpdateDispatcher.refreshAllWidgets(context)
  }
}
