package com.anonymous.digitalcalmslapp.accessibility;

import android.content.Intent;
import android.provider.Settings;
import android.content.Context;
import android.text.TextUtils;

import com.facebook.react.bridge.*;

public class AccessibilityModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext context;

    public AccessibilityModule(ReactApplicationContext context) {
        super(context);
        this.context = context;
    }

    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    /* Open Accessibility Settings */

    @ReactMethod
    public void openAccessibilitySettings() {

        Intent intent =
                new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);

        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    /* CORRECT CHECK — Using Settings.Secure */

    @ReactMethod
    public void isAccessibilityEnabled(Promise promise) {

        try {

            int accessibilityEnabled = 0;

            final String service =
                    context.getPackageName() +
                    "/com.anonymous.digitalcalmslapp.accessibility.DigitalCalmAccessibilityService";

            accessibilityEnabled = Settings.Secure.getInt(
                    context.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED
            );

            if (accessibilityEnabled == 1) {

                String settingValue = Settings.Secure.getString(
                        context.getContentResolver(),
                        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                );

                if (!TextUtils.isEmpty(settingValue)) {

                    String[] services = settingValue.split(":");

                    for (String s : services) {
                        if (s.equalsIgnoreCase(service)) {
                            promise.resolve(true);
                            return;
                        }
                    }
                }
            }

            promise.resolve(false);

        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}
