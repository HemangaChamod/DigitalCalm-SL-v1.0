package com.anonymous.digitalcalmslapp.installedapps;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.Arrays; 


public class InstalledAppsModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    private static final List<String> EXCLUDED_LAUNCHERS = Arrays.asList(
        "com.android.launcher",
        "com.android.launcher3",
        "com.google.android.apps.nexuslauncher",
        "com.miui.home",
        "com.samsung.android.launcher",
        "com.oppo.launcher",
        "com.huawei.android.launcher",
        "com.realme.launcher",
        "com.vivo.launcher"
    );

    public InstalledAppsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "InstalledApps";
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();

            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> apps = pm.queryIntentActivities(mainIntent, 0);
            WritableArray result = Arguments.createArray();

            File cacheDir = reactContext.getCacheDir();
            File iconsDir = new File(cacheDir, "app_icons");
            if (!iconsDir.exists()) iconsDir.mkdirs();

            for (ResolveInfo info : apps) {
                ApplicationInfo appInfo = info.activityInfo.applicationInfo;
                String packageName = appInfo.packageName;

                if (packageName.equals(reactContext.getPackageName())) {
                    continue;
                }
                
                String appName = pm.getApplicationLabel(appInfo).toString();

                 // Skip known launcher apps completely
                if (EXCLUDED_LAUNCHERS.contains(packageName)) {
                    continue;
                }

                // Detect System App (REAL check)
                boolean isSystemApp =
                        ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) ||
                        ((appInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0) ||
                        appInfo.sourceDir.startsWith("/system/") ||
                        appInfo.sourceDir.startsWith("/product/") ||
                        appInfo.sourceDir.startsWith("/system_ext/");

                // Skip launchers (ALL OEM launchers)
                if (packageName.matches("(?i).*launcher.*|com.miui.home|com.sec.android.app.launcher|com.android.launcher3|com.google.android.apps.nexuslauncher"))
                    continue;

                // Skip security / antivirus / device admin apps
                if (packageName.matches("(?i).*security.*|.*antivirus.*|.*device.*manager.*"))
                    continue;

                // Skip system apps entirely
                if (isSystemApp) continue;

                Drawable iconDrawable = pm.getApplicationIcon(appInfo);
                if (iconDrawable == null) continue;

                Bitmap bmp = drawableToBitmap(iconDrawable);

                String fileName = packageName.replaceAll("[^a-zA-Z0-9_]", "_") + ".png";
                File iconFile = new File(iconsDir, fileName);

                try (OutputStream out = new FileOutputStream(iconFile)) {
                    bmp.compress(Bitmap.CompressFormat.PNG, 90, out);
                } catch (Exception ignored) {}

                WritableMap map = Arguments.createMap();
                map.putString("appName", appName);
                map.putString("packageName", packageName);
                map.putString("iconUri", "file://" + iconFile.getAbsolutePath());
                map.putBoolean("isSystemApp", false);

                result.pushMap(map);
            }

            promise.resolve(result);

        } catch (Exception e) {
            promise.reject("ERR", e.getMessage());
        }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
        int w = Math.max(drawable.getIntrinsicWidth(), 72);
        int h = Math.max(drawable.getIntrinsicHeight(), 72);
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        drawable.setBounds(0, 0, w, h);
        drawable.draw(canvas);
        return bmp;
    }
}
