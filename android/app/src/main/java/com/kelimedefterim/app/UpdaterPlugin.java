package com.kelimedefterim.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

@CapacitorPlugin(name = "AppUpdater")
public class UpdaterPlugin extends Plugin {

    private static final String APK_NAME = "kelime-defterim-update.apk";

    private File apkFile() {
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = getContext().getFilesDir();
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, APK_NAME);
    }

    private void state(String value, String error) {
        JSObject o = new JSObject();
        o.put("value", value);
        if (error != null) o.put("error", error);
        notifyListeners("state", o);
    }

    private void launchInstall(PluginCall call) {
        try {
            File file = apkFile();
            if (!file.exists()) {
                call.reject("no-apk");
                return;
            }
            if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent si = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
                si.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(si);
                state("permission", null);
                JSObject ret = new JSObject();
                ret.put("state", "permission");
                call.resolve(ret);
                return;
            }
            Uri uri = FileProvider.getUriForFile(getContext(),
                    getContext().getPackageName() + ".fileprovider", file);
            Intent ii = new Intent(Intent.ACTION_VIEW);
            ii.setDataAndType(uri, "application/vnd.android.package-archive");
            ii.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(ii);
            state("installing", null);
            JSObject ret = new JSObject();
            ret.put("state", "installing");
            call.resolve(ret);
        } catch (Exception e) {
            state("failed", e.getMessage());
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void installPending(PluginCall call) {
        launchInstall(call);
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url");
        final String expected = call.getString("sha256", "");
        if (url == null || url.isEmpty()) {
            call.reject("url required");
            return;
        }
        if (!url.startsWith("https://")) {
            call.reject("https required");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    File file = apkFile();
                    conn = (HttpURLConnection) new URL(url).openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(30000);
                    conn.setReadTimeout(60000);
                    conn.connect();
                    int code = conn.getResponseCode();
                    if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
                    long total = conn.getContentLengthLong();
                    InputStream in = conn.getInputStream();
                    FileOutputStream out = new FileOutputStream(file);
                    byte[] buf = new byte[65536];
                    long done = 0;
                    int lastPct = -1;
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        out.write(buf, 0, n);
                        done += n;
                        if (total > 0) {
                            int pct = (int) (done * 100 / total);
                            if (pct != lastPct) {
                                lastPct = pct;
                                JSObject pr = new JSObject();
                                pr.put("percent", pct);
                                notifyListeners("progress", pr);
                            }
                        }
                    }
                    out.flush();
                    out.close();
                    in.close();

                    state("verifying", null);
                    if (expected != null && !expected.isEmpty()) {
                        MessageDigest md = MessageDigest.getInstance("SHA-256");
                        FileInputStream fis = new FileInputStream(file);
                        byte[] b2 = new byte[65536];
                        int r;
                        while ((r = fis.read(b2)) != -1) md.update(b2, 0, r);
                        fis.close();
                        StringBuilder hex = new StringBuilder();
                        for (byte b : md.digest()) hex.append(String.format("%02x", b));
                        if (!hex.toString().equalsIgnoreCase(expected)) {
                            file.delete();
                            throw new IOException("SHA-256 mismatch");
                        }
                    }
                    launchInstall(call);
                } catch (final Exception e) {
                    state("failed", e.getMessage());
                    call.reject(e.getMessage() != null ? e.getMessage() : "download failed");
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }
}