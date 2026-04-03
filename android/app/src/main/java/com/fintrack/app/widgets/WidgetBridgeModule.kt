package com.fintrack.app.widgets

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetBridgeModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WidgetBridge"

  @ReactMethod
  fun setWidgetSnapshot(snapshotJson: String, promise: Promise) {
    try {
      WidgetStorage.saveSnapshot(reactApplicationContext, snapshotJson)
      WidgetUpdateDispatcher.refreshAllWidgets(reactApplicationContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("WIDGET_SAVE_FAILED", error)
    }
  }

  @ReactMethod
  fun refreshWidgets() {
    WidgetUpdateDispatcher.refreshAllWidgets(reactApplicationContext)
  }
}
