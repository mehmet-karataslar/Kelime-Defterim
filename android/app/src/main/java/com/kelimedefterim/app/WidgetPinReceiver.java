package com.kelimedefterim.app;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WidgetPinReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1);
        String designId = intent.getStringExtra("design_id");
        if (widgetId != -1 && designId != null && !designId.isEmpty()) {
            context.getSharedPreferences(KelimeWidgetProvider.PREFS, Context.MODE_PRIVATE)
                    .edit().putString("map_" + widgetId, designId).apply();
        }
        KelimeWidgetProvider.renderAll(context);
    }
}