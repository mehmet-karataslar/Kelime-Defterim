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
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class KelimeWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "kelime_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) render(context, mgr, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager mgr, int id, Bundle newOptions) {
        render(context, mgr, id);
    }

    @Override
    public void onEnabled(Context context) {
        renderAll(context);
    }

    static void renderAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName cn = new ComponentName(context, KelimeWidgetProvider.class);
        for (int id : mgr.getAppWidgetIds(cn)) render(context, mgr, id);
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
            JSONArray designs = new JSONArray(p.getString("designs", "[]"));
            JSONObject data = new JSONObject(p.getString("data", "{}"));
            if (designs.length() == 0) return;

            String designId = p.getString("map_" + widgetId, p.getString("last_design", ""));
            JSONObject design = null;
            for (int i = 0; i < designs.length(); i++) {
                JSONObject d = designs.getJSONObject(i);
                if (d.optString("id").equals(designId)) { design = d; break; }
            }
            if (design == null) design = designs.getJSONObject(0);
            JSONObject cfg = design.getJSONObject("config");
            String type = cfg.optString("type", "word");

            float density = ctx.getResources().getDisplayMetrics().density;
            Bundle opts = mgr.getAppWidgetOptions(widgetId);
            int fallbackW = "small".equals(cfg.optString("size")) ? 150 : "large".equals(cfg.optString("size")) ? 300 : 230;
            int fallbackH = "small".equals(cfg.optString("size")) ? 70 : "large".equals(cfg.optString("size")) ? 180 : 120;
            int wDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, fallbackW);
            int hDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, fallbackH);
            if (wDp < 80) wDp = fallbackW;
            if (hDp < 40) hDp = fallbackH;
            int W = Math.min(1200, Math.round(wDp * density));
            int H = Math.min(800, Math.round(hDp * density));

            float fs = (float) cfg.optDouble("fontScale", 1.0);
            int bg = color(cfg.optString("bg", "#FFFFFF"), Color.WHITE);
            int text = color(cfg.optString("text", "#1E1B2E"), Color.parseColor("#1E1B2E"));
            int accent = color(cfg.optString("accent", "#4338CA"), Color.parseColor("#4338CA"));
            int border = color(cfg.optString("border", "#E5E1F5"), Color.parseColor("#E5E1F5"));
            float radius = (float) cfg.optDouble("radius", 20) * density;
            float borderW = (float) cfg.optDouble("borderWidth", 0) * density;
            boolean center = "center".equals(cfg.optString("align", "left"));
            boolean detailed = cfg.optBoolean("detailed", true);
            boolean showArticle = cfg.optBoolean("showArticle", true);
            boolean showMeaning = cfg.optBoolean("showMeaning", true);
            boolean showExample = cfg.optBoolean("showExample", false);
            long refreshMin = Math.max(1, cfg.optLong("refreshMinutes", 60));
            String lang = data.optString("lang", "tr");

            JSONArray pool = data.optJSONObject("pools") != null
                    ? data.getJSONObject("pools").optJSONArray(design.optString("id"))
                    : null;
            JSONObject word = null;
            if (pool != null && pool.length() > 0) {
                int idx = (int) ((System.currentTimeMillis() / (refreshMin * 60000L)) % pool.length());
                word = pool.getJSONObject(idx);
            }

            Bitmap bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(bmp);
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

            float pad = 14 * density;
            float maxW = W - pad * 2;
            String german = word != null ? word.optString("g", "") : "";
            String article = word != null ? word.optString("a", "") : "";
            String meaning = word != null ? word.optString("m", "") : "";
            String example = word != null ? word.optString("e", "") : "";

            TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            tp.setTypeface(font(cfg.optString("font", "sans")));
            tp.setColor(text);

            float y = pad;
            if ("goal".equals(type)) {
                int done = data.optInt("done", 0);
                int goal = Math.max(1, data.optInt("goal", 10));
                tp.setTextSize(10 * fs * density);
                tp.setColor(alpha(text, 160));
                tp.setFakeBoldText(true);
                String label = "de".equals(lang) ? "TAGESZIEL" : "en".equals(lang) ? "DAILY GOAL" : "GÜNLÜK HEDEF";
                drawText(c, tp, label, pad, y + tp.getTextSize(), maxW, center, W);
                y += 14 * fs * density + 6 * density;
                tp.setColor(text);
                tp.setTextSize(20 * fs * density);
                tp.setFakeBoldText(true);
                String count = done + " / " + goal;
                drawText(c, tp, count, pad, y + tp.getTextSize(), maxW, center, W);
                y += 24 * fs * density + 8 * density;
                float barH = 7 * fs * density;
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
                tp.setTextSize(24 * fs * density);
                tp.setFakeBoldText(true);
                drawText(c, tp, String.valueOf(due), pad, y + tp.getTextSize(), maxW, center, W);
                y += 27 * fs * density + 3 * density;
                tp.setColor(alpha(text, 160));
                tp.setTextSize(11 * fs * density);
                tp.setFakeBoldText(false);
                String label = "de".equals(lang) ? "Wörter warten" : "en".equals(lang) ? "words waiting" : "kelime seni bekliyor";
                drawText(c, tp, due + " " + label, pad, y + tp.getTextSize(), maxW, center, W);
                if (detailed && H > 100 * density) {
                    y += 15 * fs * density + 8 * density;
                    String btn = "de".equals(lang) ? "Wiederholen" : "en".equals(lang) ? "Start review" : "Tekrara Başla";
                    tp.setTextSize(10 * fs * density);
                    tp.setFakeBoldText(true);
                    float tw = tp.measureText(btn);
                    float bw = tw + 20 * density;
                    float bh = 22 * density;
                    float bx = center ? (W - bw) / 2 : pad;
                    Paint bp2 = new Paint(Paint.ANTI_ALIAS_FLAG);
                    bp2.setColor(accent);
                    c.drawRoundRect(new RectF(bx, y, bx + bw, y + bh), bh / 2, bh / 2, bp2);
                    tp.setColor(Color.WHITE);
                    c.drawText(btn, bx + 10 * density, y + bh / 2 + tp.getTextSize() / 3, tp);
                }
            } else if ("quiz".equals(type)) {
                tp.setTextSize(15 * fs * density);
                tp.setFakeBoldText(true);
                String q = german.isEmpty() ? "Kelime Defterim" : "___ " + german;
                drawText(c, tp, q, pad, y + tp.getTextSize(), maxW, center, W);
            } else {
                boolean compact = "compact".equals(type);
                if (!compact && showArticle && !article.isEmpty()) {
                    int ac = articleColor(article);
                    tp.setTextSize(9.5f * fs * density);
                    tp.setFakeBoldText(true);
                    float tw = tp.measureText(article);
                    float chipW = tw + 14 * density;
                    float chipH = 15 * density;
                    float cx = center ? (W - chipW) / 2 : pad;
                    Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
                    cp.setColor(alpha(ac, 36));
                    c.drawRoundRect(new RectF(cx, y, cx + chipW, y + chipH), chipH / 2, chipH / 2, cp);
                    tp.setColor(ac);
                    c.drawText(article, cx + 7 * density, y + chipH / 2 + tp.getTextSize() / 3, tp);
                    y += chipH + 4 * density;
                }
                tp.setColor(text);
                tp.setTextSize((compact ? 15 : 18) * fs * density);
                tp.setFakeBoldText(true);
                String head = (compact && showArticle && !article.isEmpty() ? article + " " : "") + (german.isEmpty() ? "Kelime Defterim" : german);
                CharSequence ell = TextUtils.ellipsize(head, tp, maxW, TextUtils.TruncateAt.END);
                drawText(c, tp, ell.toString(), pad, y + tp.getTextSize(), maxW, center, W);
                y += (compact ? 17 : 21) * fs * density + 2 * density;
                if (showMeaning && !meaning.isEmpty()) {
                    tp.setColor(alpha(text, 160));
                    tp.setTextSize(11.5f * fs * density);
                    tp.setFakeBoldText(false);
                    CharSequence ell2 = TextUtils.ellipsize(meaning, tp, maxW, TextUtils.TruncateAt.END);
                    drawText(c, tp, ell2.toString(), pad, y + tp.getTextSize(), maxW, center, W);
                    y += 14 * fs * density + 2 * density;
                }
                if (!compact && detailed && showExample && !example.isEmpty() && y < H - pad - 10 * density) {
                    tp.setColor(alpha(text, 130));
                    tp.setTextSize(10 * fs * density);
                    tp.setTextSkewX(-0.2f);
                    CharSequence ell3 = TextUtils.ellipsize(example, tp, maxW, TextUtils.TruncateAt.END);
                    drawText(c, tp, ell3.toString(), pad, y + tp.getTextSize(), maxW, center, W);
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
                    int bw = Math.round(70 * density);
                    int bh = Math.round(34 * density);
                    Bitmap bb = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
                    Canvas bc = new Canvas(bb);
                    int ac = articleColor(arts[i]);
                    Paint bp3 = new Paint(Paint.ANTI_ALIAS_FLAG);
                    bp3.setColor(alpha(ac, 40));
                    bc.drawRoundRect(new RectF(0, 0, bw, bh), bh / 2f, bh / 2f, bp3);
                    TextPaint btp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
                    btp.setTypeface(font(cfg.optString("font", "sans")));
                    btp.setFakeBoldText(true);
                    btp.setTextSize(12 * fs * density);
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
        } catch (Exception e) {
            // keep the previous widget rendering on malformed data
        }
    }

    private static void drawText(Canvas c, TextPaint tp, String s, float pad, float baseline, float maxW, boolean center, int W) {
        CharSequence ell = TextUtils.ellipsize(s, tp, maxW, TextUtils.TruncateAt.END);
        String out = ell.toString();
        float x = center ? (W - tp.measureText(out)) / 2 : pad;
        c.drawText(out, x, baseline, tp);
    }
}