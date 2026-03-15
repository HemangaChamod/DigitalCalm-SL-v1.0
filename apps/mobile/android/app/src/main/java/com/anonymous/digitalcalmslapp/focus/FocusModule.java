package com.anonymous.digitalcalmslapp.focus;

import com.facebook.react.bridge.*;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

public class FocusModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public FocusModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "FocusModule";
    }

    @ReactMethod
    public void setFocusActive(boolean active) {
        FocusStore.setFocusActive(reactContext, active);
    }

    @ReactMethod
    public void isFocusActive(Promise promise) {
        promise.resolve(FocusStore.isFocusActive(reactContext));
    }

    @ReactMethod
    public void isAccessibilityEnabled(Promise promise) {
        try {
            int enabled = android.provider.Settings.Secure.getInt(
                    reactContext.getContentResolver(),
                    android.provider.Settings.Secure.ACCESSIBILITY_ENABLED
            );
            promise.resolve(enabled == 1);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void setDistractingApps(ReadableArray array) {
        Set<String> set = new HashSet<>();
        for (int i = 0; i < array.size(); i++) {
            set.add(array.getString(i));
        }
        FocusStore.setDistractingApps(reactContext, set);
    }

    @ReactMethod
    public void getDistractingApps(Promise promise) {
        Set<String> set = FocusStore.getDistractingApps(reactContext);
        WritableArray arr = Arguments.createArray();
        for (String pkg : set) {
            arr.pushString(pkg);
        }
        promise.resolve(arr);
    }

    @ReactMethod
    public void setSchedules(ReadableArray schedules) {
        JSONArray arr = new JSONArray();
        for (int i = 0; i < schedules.size(); i++) {
            arr.put(Arguments.toBundle(schedules.getMap(i)));
        }
        FocusStore.setSchedules(reactContext, arr);
    }

    @ReactMethod
    public void getSchedules(Promise promise) {
        JSONArray arr = FocusStore.getSchedules(reactContext);
        promise.resolve(arr.toString());
    }
}