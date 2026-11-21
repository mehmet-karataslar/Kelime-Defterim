package com.kelimedefterim.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.TextPaint;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class KelimeWidgetProvider extends AppWidgetProvider {

    static final String TAG = "KelimeWidget";
    static final String PREFS = "kelime_widget";
    public static final String ACTION_UPDATE_WIDGET = "com.kelimedefterim.app.ACTION_UPDATE_WIDGET";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_UPDATE_WIDGET.equals(action)) {
            Log.d(TAG, "Received custom ACTION_UPDATE_WIDGET");
            renderAll(context);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        Log.d(TAG, "onUpdate called for " + ids.length + " widgets");
        for (int id : ids) render(context, mgr, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager mgr, int id, Bundle newOptions) {
        Log.d(TAG, "onAppWidgetOptionsChanged for widget " + id);
        render(context, mgr, id);
    }

    @Override
    public void onEnabled(Context context) {
        Log.d(TAG, "onEnabled called");
        renderAll(context);
    }

    static void renderAll(Context context) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            ComponentName cn = new ComponentName(context, KelimeWidgetProvider.class);
            int[] ids = mgr.getAppWidgetIds(cn);
            Log.d(TAG, "renderAll: updating " + ids.length + " active widgets");
            for (int id : ids) render(context, mgr, id);
        } catch (Exception e) {
            Log.e(TAG, "renderAll error: " + e.getMessage(), e);
        }
    }

    private static int color(String hex, int fallback) {
        try { return Color.parseColor(hex); } catch (Exception e) { return fallback; }
    }

    private static int alpha(int c, int a) {
        return (c & 0x00FFFFFF) | (a << 24);
    }

    private static int articleColor(String a) {
        if ("der".equals(a)) return Color.parseColor("#2563EB");
        if ("die".equals(a)) return Color.parseColor("#E11D48");
        return Color.parseColor("#059669");
    }

    private static Typeface font(String f) {
        if ("serif".equals(f)) return Typeface.SERIF;
        if ("mono".equals(f)) return Typeface.MONOSPACE;
        return Typeface.create("sans-serif", Typeface.NORMAL);
    }

    static void render(Context ctx, AppWidgetManager mgr, int widgetId) {
        try {
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray designs;
            try {
                designs = new JSONArray(p.getString("designs", "[]"));
            } catch (Exception e) {
                designs = new JSONArray();
            }

            JSONObject data;
            try {
                data = new JSONObject(p.getString("data", "{}"));
            } catch (Exception e) {
                data = new JSONObject();
            }

            String designId = p.getString("map_" + widgetId, p.getString("last_design", ""));
            JSONObject design = null;
            for (int i = 0; i < designs.length(); i++) {
                JSONObject d = designs.getJSONObject(i);
                if (d.optString("id").equals(designId)) { design = d; break; }
            }
            if (design == null && designs.length() > 0) {
                design = designs.getJSONObject(0);
            }

            JSONObject cfg = design != null ? design.optJSONObject("config") : null;
            if (cfg == null) {
                cfg = new JSONObject();
                cfg.put("type", "word");
                cfg.put("size", "medium");
                cfg.put("bg", "#FFFFFF");
                cfg.put("text", "#1E1B2E");
                cfg.put("accent", "#4338CA");
                cfg.put("border", "#E5E1F5");
                cfg.put("borderWidth", 1);
                cfg.put("font", "sans");
                cfg.put("fontScale", 1.0);
                cfg.put("radius", 18);
                cfg.put("align", "left");
                cfg.put("detailed", true);
                cfg.put("showArticle", true);
                cfg.put("showMeaning", true);
                cfg.put("showExample", true);
                cfg.put("refreshMinutes", 60);
            }

            String type = cfg.optString("type", "word");
            String size = cfg.optString("size", "medium");

            Bundle opts = mgr.getAppWidgetOptions(widgetId);
            int fallbackW = "small".equals(size) ? 140 : "large".equals(size) ? 280 : 210;
            int fallbackH = "small".equals(size) ? 70 : "large".equals(size) ? 170 : 110;
            int wDp = opts != null ? opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, fallbackW) : fallbackW;
            int hDp = opts != null ? opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, fallbackH) : fallbackH;
            if (wDp < 80) wDp = fallbackW;
            if (hDp < 40) hDp = fallbackH;

            // Cap bitmap dimensions to prevent TransactionTooLargeException (limit IPC parcel to < 400KB)
            int W = Math.min(480, Math.max(220, Math.round(wDp * 1.35f)));
            int H = Math.min(280, Math.max(110, Math.round(hDp * 1.35f)));
            float drawScale = W / (float) wDp;

            float fs = (float) cfg.optDouble("fontScale", 1.0);
            int bg = color(cfg.optString("bg", "#FFFFFF"), Color.WHITE);
            int text = color(cfg.optString("text", "#1E1B2E"), Color.parseColor("#1E1B2E"));
            int accent = color(cfg.optString("accent", "#4338CA"), Color.parseColor("#4338CA"));
            int border = color(cfg.optString("border", "#E5E1F5"), Color.parseColor("#E5E1F5"));
            float radius = (float) cfg.optDouble("radius", 18) * drawScale;
            float borderW = (float) cfg.optDouble("borderWidth", 1) * drawScale;
            boolean center = "center".equals(cfg.optString("align", "left"));
            boolean detailed = cfg.optBoolean("detailed", true);
            boolean showArticle = cfg.optBoolean("showArticle", true);
            boolean showMeaning = cfg.optBoolean("showMeaning", true);
            boolean showExample = cfg.optBoolean("showExample", false);
            long refreshMin = Math.max(1, cfg.optLong("refreshMinutes", 60));
            String lang = data.optString("lang", "tr");

            String curDesignId = design != null ? design.optString("id", "w-default") : "w-default";
            JSONArray pool = data.optJSONObject("pools") != null
                    ? data.getJSONObject("pools").optJSONArray(curDesignId)
                    : null;
            if (pool == null && data.optJSONObject("pools") != null && data.getJSONObject("pools").length() > 0) {
                String firstKey = data.getJSONObject("pools").keys().next();
                pool = data.getJSONObject("pools").optJSONArray(firstKey);
            }

            JSONObject word = null;
            if (pool != null && pool.length() > 0) {
                int idx = (int) ((System.currentTimeMillis() / (refreshMin * 60000L)) % pool.length());
                word = pool.getJSONObject(idx);
            }

            // Create bitmap safely
            Bitmap bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(bmp);

            // Draw background rounded rectangle
            Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            bgPaint.setColor(bg);
            RectF rect = new RectF(0, 0, W, H);
            c.drawRoundRect(rect, radius, radius, bgPaint);

            if (borderW > 0) {
                Paint bp = new Paint(Paint.ANTI_ALIAS_FLAG);
                bp.setStyle(Paint.Style.STROKE);
                bp.setStrokeWidth(borderW);
                bp.setColor(border);
                RectF br = new RectF(borderW / 2, borderW / 2, W - borderW / 2, H - borderW / 2);
                c.drawRoundRect(br, radius, radius, bp);
            }

            float pad = 12 * drawScale;
            float maxW = W - pad * 2;
            String german = word != null ? word.optString("g", "die Möglichkeit") : "die Möglichkeit";
            String article = word != null ? word.optString("a", "die") : "die";
            String meaning = word != null ? word.optString("m", "İmkân, olasılık") : "İmkân, olasılık";
            String example = word != null ? word.optString("e", "Es gibt viele Möglichkeiten.") : "Es gibt viele Möglichkeiten.";

            TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            tp.setTypeface(font(cfg.optString("font", "sans")));
            tp.setColor(text);

            float y = pad;
            if ("goal".equals(type)) {
                int done = data.optInt("done", 0);
                int goal = Math.max(1, data.optInt("goal", 10));
                tp.setTextSize(9 * fs * drawScale);
                tp.setColor(alpha(text, 160));
                tp.setFakeBoldText(true);
                String label = "de".equals(lang) ? "TAGESZIEL" : "en".equals(lang) ? "DAILY GOAL" : "GÜNLÜK HEDEF";
                drawText(c, tp, label, pad, y + tp.getTextSize(), maxW, center, W);
                y += 13 * fs * drawScale + 5 * drawScale;
                tp.setColor(text);
                tp.setTextSize(19 * fs * drawScale);
                tp.setFakeBoldText(true);
                String count = done + " / " + goal;
                drawText(c, tp, count, pad, y + tp.getTextSize(), maxW, center, W);
                y += 22 * fs * drawScale + 7 * drawScale;
                float barH = 6 * fs * drawScale;
                Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
                track.setColor(alpha(text, 30));
                c.drawRoundRect(new RectF(pad, y, W - pad, y + barH), barH / 2, barH / 2, track);
                Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
                fill.setColor(accent);
                float pct = Math.min(1f, done / (float) goal);
                if (pct > 0) c.drawRoundRect(new RectF(pad, y, pad + (W - pad * 2) * pct, y + barH), barH / 2, barH / 2, fill);
            } else if ("review".equals(type)) {
                int due = data.optInt("due", 0);
                tp.setColor(accent);
                tp.setTextSize(22 * fs * drawScale);
                tp.setFakeBoldText(true);
                drawText(c, tp, String.valueOf(due), pad, y + tp.getTextSize(), maxW, center, W);
                y += 25 * fs * drawScale + 3 * drawScale;
                tp.setColor(alpha(text, 160));
                tp.setTextSize(11 * fs * drawScale);
                tp.setFakeBoldText(false);
                String label = "de".equals(lang) ? "Wörter warten" : "en".equals(lang) ? "words waiting" : "kelime tekrar bekliyor";
                drawText(c, tp, due + " " + label, pad, y + tp.getTextSize(), maxW, center, W);
                if (detailed && H > 90 * drawScale) {
                    y += 14 * fs * drawScale + 6 * drawScale;
                    String btn = "de".equals(lang) ? "Wiederholen" : "en".equals(lang) ? "Start review" : "Tekrara Başla";
                    tp.setTextSize(9.5f * fs * drawScale);
                    tp.setFakeBoldText(true);
                    float tw = tp.measureText(btn);
                    float bw = tw + 18 * drawScale;
                    float bh = 20 * drawScale;
                    float bx = center ? (W - bw) / 2 : pad;
                    Paint bp2 = new Paint(Paint.ANTI_ALIAS_FLAG);
                    bp2.setColor(accent);
                    c.drawRoundRect(new RectF(bx, y, bx + bw, y + bh), bh / 2, bh / 2, bp2);
                    tp.setColor(Color.WHITE);
                    c.drawText(btn, bx + 9 * drawScale, y + bh / 2 + tp.getTextSize() / 3, tp);
                }
            } else if ("quiz".equals(type)) {
                tp.setTextSize(14 * fs * drawScale);
                tp.setFakeBoldText(true);
                String q = german.isEmpty() ? "Kelime Defterim" : "___ " + german;
                drawText(c, tp, q, pad, y + tp.getTextSize(), maxW, center, W);
            } else {
                boolean compact = "compact".equals(type);
                if (!compact && showArticle && !article.isEmpty()) {
                    int ac = articleColor(article);
                    tp.setTextSize(9 * fs * drawScale);
                    tp.setFakeBoldText(true);
                    float tw = tp.measureText(article);
                    float chipW = tw + 12 * drawScale;
                    float chipH = 14 * drawScale;
                    float cx = center ? (W - chipW) / 2 : pad;
                    Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
                    cp.setColor(alpha(ac, 36));
                    c.drawRoundRect(new RectF(cx, y, cx + chipW, y + chipH), chipH / 2, chipH / 2, cp);
                    tp.setColor(ac);
                    c.drawText(article, cx + 6 * drawScale, y + chipH / 2 + tp.getTextSize() / 3, tp);
                    y += chipH + 3 * drawScale;
                }
                tp.setColor(text);
                tp.setTextSize((compact ? 14 : 17) * fs * drawScale);
                tp.setFakeBoldText(true);
                String head = (compact && showArticle && !article.isEmpty() ? article + " " : "") + german;
                drawText(c, tp, head, pad, y + tp.getTextSize(), maxW, center, W);
                y += (compact ? 16 : 20) * fs * drawScale + 2 * drawScale;
                if (showMeaning && !meaning.isEmpty()) {
                    tp.setColor(alpha(text, 160));
                    tp.setTextSize(11 * fs * drawScale);
                    tp.setFakeBoldText(false);
                    drawText(c, tp, meaning, pad, y + tp.getTextSize(), maxW, center, W);
                    y += 13 * fs * drawScale + 2 * drawScale;
                }
                if (!compact && detailed && showExample && !example.isEmpty() && y < H - pad - 8 * drawScale) {
                    tp.setColor(alpha(text, 130));
                    tp.setTextSize(9.5f * fs * drawScale);
                    tp.setTextSkewX(-0.2f);
                    drawText(c, tp, example, pad, y + tp.getTextSize(), maxW, center, W);
                    tp.setTextSkewX(0);
                }
            }

            RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_root);
            views.setImageViewBitmap(R.id.w_content, bmp);

            PendingIntent launch = PendingIntent.getActivity(
                    ctx, widgetId,
                    new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.w_content, launch);

            if ("quiz".equals(type)) {
                views.setViewVisibility(R.id.w_quiz_row, View.VISIBLE);
                String[] arts = {"der", "die", "das"};
                int[] btnIds = {R.id.w_btn_der, R.id.w_btn_die, R.id.w_btn_das};
                for (int i = 0; i < 3; i++) {
                    int bw = Math.round(60 * drawScale);
                    int bh = Math.round(30 * drawScale);
                    Bitmap bb = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
                    Canvas bc = new Canvas(bb);
                    int ac = articleColor(arts[i]);
                    Paint bp3 = new Paint(Paint.ANTI_ALIAS_FLAG);
                    bp3.setColor(alpha(ac, 40));
                    bc.drawRoundRect(new RectF(0, 0, bw, bh), bh / 2f, bh / 2f, bp3);
                    TextPaint btp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
                    btp.setTypeface(font(cfg.optString("font", "sans")));
                    btp.setFakeBoldText(true);
                    btp.setTextSize(11 * fs * drawScale);
                    btp.setColor(ac);
                    float tw = btp.measureText(arts[i]);
                    bc.drawText(arts[i], (bw - tw) / 2, bh / 2f + btp.getTextSize() / 3, btp);
                    views.setImageViewBitmap(btnIds[i], bb);
                    views.setOnClickPendingIntent(btnIds[i], launch);
                }
            } else {
                views.setViewVisibility(R.id.w_quiz_row, View.GONE);
            }

            mgr.updateAppWidget(widgetId, views);
            Log.d(TAG, "Successfully rendered widget " + widgetId + " (size: " + W + "x" + H + ", " + bmp.getByteCount() + " bytes)");
        } catch (Exception e) {
            Log.e(TAG, "Error rendering widget " + widgetId + ": " + e.getMessage(), e);
        }
    }

    private static void drawText(Canvas c, TextPaint tp, String s, float pad, float baseline, float maxW, boolean center, int W) {
        if (s == null || s.isEmpty()) return;
        CharSequence ell = TextUtils.ellipsize(s, tp, maxW, TextUtils.TruncateAt.END);
        String out = ell.toString();
        float x = center ? (W - tp.measureText(out)) / 2 : pad;
        c.drawText(out, x, baseline, tp);
    }
}
