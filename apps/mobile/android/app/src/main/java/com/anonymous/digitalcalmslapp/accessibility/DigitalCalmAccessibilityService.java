package com.anonymous.digitalcalmslapp.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;

import com.anonymous.digitalcalmslapp.focus.FocusStore;
import com.anonymous.digitalcalmslapp.limit.LimitStore;
import com.anonymous.digitalcalmslapp.limit.LimitEnforcer;

public class DigitalCalmAccessibilityService extends AccessibilityService {

    private String currentPackage = "";
    private long lastMinuteTick = 0;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private final Runnable usageRunnable = new Runnable() {
        @Override
        public void run() {

            if (currentPackage != null &&
                    !currentPackage.equals(getPackageName())) {

                long now = System.currentTimeMillis();

                if (now - lastMinuteTick >= 60000) {
                    LimitStore.addUsage(
                            DigitalCalmAccessibilityService.this,
                            currentPackage,
                            1
                    );
                    lastMinuteTick = now;
                }

                // FIX: Only auto-toggle if schedules exist
                if (FocusStore.getSchedules(
                        DigitalCalmAccessibilityService.this).length() > 0) {

                    boolean scheduleActive =
                            FocusStore.isScheduleActive(
                                    DigitalCalmAccessibilityService.this);

                    FocusStore.setFocusActive(
                            DigitalCalmAccessibilityService.this,
                            scheduleActive);
                }

                LimitEnforcer.enforceIfNeeded(
                        DigitalCalmAccessibilityService.this,
                        currentPackage);
            }

            handler.postDelayed(this, 1000);
        }
    };

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {

        if (event == null || event.getPackageName() == null)
            return;

        String pkg = event.getPackageName().toString();

        if (pkg.equals(getPackageName()))
            return;

        currentPackage = pkg;

        LimitEnforcer.enforceIfNeeded(this, pkg);
    }

    @Override
    public void onInterrupt() {}

    @Override
    protected void onServiceConnected() {

        AccessibilityServiceInfo info =
                new AccessibilityServiceInfo();

        info.eventTypes =
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;

        info.feedbackType =
                AccessibilityServiceInfo.FEEDBACK_GENERIC;

        setServiceInfo(info);

        handler.post(usageRunnable);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(usageRunnable);
        super.onDestroy();
    }
}