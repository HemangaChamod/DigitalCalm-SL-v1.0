package com.anonymous.digitalcalmslapp.accessibility;

import com.facebook.react.*;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.ViewManager;

import java.util.*;

public class AccessibilityPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {

        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AccessibilityModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(
            ReactApplicationContext reactContext) {

        return Collections.emptyList();
    }
}
