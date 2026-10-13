package app.familyrecords.directory;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private static final int MAX_BYTES = 50 * 1024 * 1024;
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static AppUpdatePlugin instance;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean(false);

    @Override
    public void load() {
        instance = this;
    }

    static void emitInstallStatus(String status) {
        AppUpdatePlugin plugin = instance;
        if (plugin == null) return;
        MAIN.post(() -> {
            JSObject data = new JSObject();
            data.put("status", status);
            plugin.notifyListeners("installStatus", data);
        });
    }

    @PluginMethod
    public void canRequestInstall(PluginCall call) {
        JSObject result = new JSObject();
        result.put("allowed", canInstall(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void readRelease(PluginCall call) {
        String url = call.getString("url");
        String anonKey = call.getString("anonKey", "");
        if (!isReleaseFile(url, "version.json")) {
            call.reject("That address is not a Family Records build.");
            return;
        }
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = open(url, anonKey);
                int code = connection.getResponseCode();
                if (!sameReleaseHost(url, connection.getURL().toString(), "version.json")) {
                    call.reject("That address is not a Family Records build.");
                    return;
                }
                if (code == 400 || code == 404) {
                    call.reject("no-release");
                    return;
                }
                if (code != 200) {
                    call.reject("The latest build could not be read.");
                    return;
                }
                String body = new String(readLimited(connection.getInputStream()), java.nio.charset.StandardCharsets.UTF_8);
                JSONObject json = new JSONObject(body);
                JSObject result = new JSObject();
                result.put("versionCode", json.getInt("versionCode"));
                result.put("versionName", json.optString("versionName", String.valueOf(json.getInt("versionCode"))));
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("The latest build could not be read.");
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String anonKey = call.getString("anonKey", "");
        int expectedVersion = readVersionCode(call);
        if (!isReleaseFile(url, "family-records.apk") || expectedVersion < 1) {
            call.reject("That address is not a Family Records build.");
            return;
        }
        if (!busy.compareAndSet(false, true)) {
            call.reject("An update is already downloading.");
            return;
        }
        Context context = getContext();
        executor.execute(() -> {
            HttpURLConnection connection = null;
            File apk = new File(context.getCacheDir(), "family-records-update.apk");
            try {
                try {
                    connection = open(url, anonKey);
                    int code = connection.getResponseCode();
                    if (!sameReleaseHost(url, connection.getURL().toString(), "family-records.apk")) {
                        call.reject("That address is not a Family Records build.");
                        return;
                    }
                    if (code != 200) {
                        call.reject("The update could not be downloaded.");
                        return;
                    }
                    try (InputStream input = connection.getInputStream(); OutputStream output = new FileOutputStream(apk)) {
                        byte[] buffer = new byte[64 * 1024];
                        int total = 0;
                        int read;
                        while ((read = input.read(buffer)) != -1) {
                            total += read;
                            if (total > MAX_BYTES) {
                                call.reject("The update could not be downloaded.");
                                return;
                            }
                            output.write(buffer, 0, read);
                        }
                    }
                    if (!isFamilyRecordsPackage(context, apk, expectedVersion)) {
                        call.reject("The update could not be downloaded.");
                        return;
                    }
                } catch (Exception exception) {
                    call.reject("The update could not be downloaded.");
                    return;
                } finally {
                    if (connection != null) connection.disconnect();
                }
                try {
                    install(context, apk);
                } catch (Exception exception) {
                    call.reject("The update could not be installed.");
                    return;
                }
                call.resolve();
            } finally {
                if (apk.exists() && !apk.delete()) {
                    apk.deleteOnExit();
                }
                busy.set(false);
            }
        });
    }

    /** The bridge may deliver the version as an int or a whole number. */
    private static int readVersionCode(PluginCall call) {
        try {
            return call.getData().getInt("versionCode");
        } catch (Exception exception) {
            return 0;
        }
    }

    static boolean isReleaseFile(String value, String fileName) {
        if (value == null || fileName == null) return false;
        Uri uri = Uri.parse(value);
        if (!"https".equals(uri.getScheme()) || uri.getUserInfo() != null) return false;
        String path = uri.getPath();
        return path != null && path.endsWith("/storage/v1/object/public/app-releases/" + fileName);
    }

    /** A redirect may stay on the same Supabase host. It may not leave that host. */
    static boolean sameReleaseHost(String original, String redirected, String fileName) {
        if (!isReleaseFile(original, fileName) || !isReleaseFile(redirected, fileName)) return false;
        String originalHost = Uri.parse(original).getHost();
        String redirectedHost = Uri.parse(redirected).getHost();
        return originalHost != null && originalHost.equalsIgnoreCase(redirectedHost);
    }

    private static boolean isFamilyRecordsPackage(Context context, File apk, int expectedVersion) throws Exception {
        if (!looksLikeZip(apk)) return false;
        String path = apk.getAbsolutePath();
        PackageInfo info = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            ? context.getPackageManager().getPackageArchiveInfo(path, PackageManager.PackageInfoFlags.of(0))
            : context.getPackageManager().getPackageArchiveInfo(path, 0);
        if (info == null || !context.getPackageName().equals(info.packageName)) return false;
        long version = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
        return version >= expectedVersion;
    }

    private static boolean looksLikeZip(File apk) throws Exception {
        try (InputStream input = new java.io.FileInputStream(apk)) {
            return input.read() == 'P' && input.read() == 'K';
        }
    }

    private static boolean canInstall(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return context.getPackageManager().canRequestPackageInstalls();
    }

    private static HttpURLConnection open(String url, String anonKey) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(120_000);
        connection.setRequestProperty("Cache-Control", "no-cache");
        if (anonKey != null && !anonKey.isEmpty()) {
            connection.setRequestProperty("apikey", anonKey);
            connection.setRequestProperty("Authorization", "Bearer " + anonKey);
        }
        return connection;
    }

    private static byte[] readLimited(InputStream input) throws Exception {
        byte[] buffer = new byte[8192];
        int total = 0;
        byte[] body = new byte[0];
        int read;
        while ((read = input.read(buffer)) != -1) {
            total += read;
            if (total > 64 * 1024) throw new IllegalStateException("version file is too large");
            byte[] next = new byte[body.length + read];
            System.arraycopy(body, 0, next, 0, body.length);
            System.arraycopy(buffer, 0, next, body.length, read);
            body = next;
        }
        return body;
    }

    private static void install(Context context, File apk) throws Exception {
        PackageInstaller installer = context.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(context.getPackageName());
        params.setSize(apk.length());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
        }
        int sessionId = installer.createSession(params);
        PackageInstaller.Session session = installer.openSession(sessionId);
        try {
            try (OutputStream output = session.openWrite("family-records.apk", 0, apk.length());
                InputStream input = new java.io.FileInputStream(apk)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
                session.fsync(output);
            }
            Intent callback = new Intent(context, ApkInstallReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent pending = PendingIntent.getBroadcast(context, sessionId, callback, flags);
            session.commit(pending.getIntentSender());
        } catch (Exception exception) {
            try {
                session.abandon();
            } catch (Exception ignored) {
                // Report the failure that stopped the install.
            }
            throw exception;
        } finally {
            try {
                session.close();
            } catch (Exception ignored) {
                // The session is already committed or abandoned.
            }
        }
    }
}
