package com.fintrack.app.widgets

import android.content.Context

object WidgetStorage {
  private const val PREFS_NAME = "fintrack_widgets"
  private const val KEY_SNAPSHOT = "widget_snapshot"

  fun saveSnapshot(context: Context, snapshotJson: String) {
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_SNAPSHOT, snapshotJson)
      .apply()
  }

  fun getSnapshot(context: Context): String? =
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(KEY_SNAPSHOT, null)
}
