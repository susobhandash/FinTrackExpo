package com.fintrack.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.fintrack.app.MainActivity

object WidgetUpdateDispatcher {
  fun refreshAllWidgets(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val providers = listOf(
      MonthlySpendWidgetProvider::class.java,
      IncomeExpenseWidgetProvider::class.java,
      QuickActionsWidgetProvider::class.java,
    )

    providers.forEach { providerClass ->
      val component = ComponentName(context, providerClass)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isNotEmpty()) {
        val intent = Intent(context, providerClass).apply {
          action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
          putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }
        context.sendBroadcast(intent)
      }
    }
  }

  fun createDeepLinkPendingIntent(
    context: Context,
    uriString: String,
    requestCode: Int,
  ): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString), context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}
