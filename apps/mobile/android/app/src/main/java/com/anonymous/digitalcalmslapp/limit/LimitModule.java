package com.anonymous.digitalcalmslapp.limit;

import com.facebook.react.bridge.*;

public class LimitModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext context;

    public LimitModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
    }

    @Override
    public String getName() {
        return "LimitModule";
    }

    /* -------- SET LIMIT -------- */

    @ReactMethod
    public void setAppLimit(String packageName, int minutes, Promise promise) {
        try {
            LimitStore.setLimit(context, packageName, minutes);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("LIMIT_SET_ERROR", e);
        }
    }

    /* -------- GET LIMIT -------- */

    @ReactMethod
    public void getLimit(String packageName, Promise promise) {
        try {
            int limit = LimitStore.getLimit(context, packageName);
            promise.resolve(limit);
        } catch (Exception e) {
            promise.reject("LIMIT_GET_ERROR", e);
        }
    }

    /* -------- GET TODAY USAGE -------- */

    @ReactMethod
    public void getTodayUsage(String packageName, Promise promise) {
        try {
            int used = LimitStore.getTodayUsage(context, packageName);
            promise.resolve(used);
        } catch (Exception e) {
            promise.reject("USAGE_ERROR", e);
        }
    }
    
    @ReactMethod
    public void isLocked(String packageName, Promise promise) {
        try {
            boolean locked = LimitStore.isLocked(context, packageName);
            promise.resolve(locked);
        } catch (Exception e) {
            promise.reject("LOCK_CHECK_ERROR", e);
        }
    }

}
