package com.kelimedefterim.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String designs = call.getString("designs", "[]");
        String data = call.getString("data", "{}");
        String last = call.getString("lastDesign", "");
        getContext().getSharedPreferences(KelimeWidgetProvider.PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString("designs", designs)
                .putString("data", data)
                .putString("last_design", last)
                .apply();
        KelimeWidgetProvider.renderAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pinWidget(PluginCall call) {
        JSObject ret = new JSObject();
        String designId = call.getString("designId", "");
        if (Build.VERSION.SDK_INT < 26) {
            ret.put("supported", false);
            call.resolve(ret);
            return;
        }
        AppWidgetManager mgr = AppWidgetManager.getInstance(getContext());
        ComponentName provider = new ComponentName(getContext(), KelimeWidgetProvider.class);
        if (!mgr.isRequestPinAppWidgetSupported()) {
            ret.put("supported", false);
            call.resolve(ret);
            return;
        }
        Intent cb = new Intent(getContext(), WidgetPinReceiver.class);
        cb.putExtra("design_id", designId);
        PendingIntent pi = PendingIntent.getBroadcast(
                getContext(), designId.hashCode(), cb,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Bundle extras = new Bundle();
        extras.putString("design_id", designId);
        boolean ok = mgr.requestPinAppWidget(provider, extras, pi);
        ret.put("supported", true);
        ret.put("requested", ok);
        call.resolve(ret);
    }
}