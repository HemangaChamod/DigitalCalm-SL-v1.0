package com.anonymous.digitalcalmslapp.limit;

import android.accessibilityservice.AccessibilityService;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

import com.anonymous.digitalcalmslapp.R;
import com.anonymous.digitalcalmslapp.focus.FocusStore;

import java.util.HashMap;
import java.util.Map;

public class LimitEnforcer {

    private static final Handler handler =
            new Handler(Looper.getMainLooper());

    // Prevent spam notifications
    private static final Map<String, Long> lastFocusTrigger =
            new HashMap<>();

    private static final long FOCUS_COOLDOWN = 4000; // 4 sec

    /* =========================================================
       MAIN CHECK
       ========================================================= */

    public static void enforceIfNeeded(Context ctx, String pkg) {

        if (pkg == null) return;

        // ================= FOCUS MODE =================
        if (FocusStore.isFocusActive(ctx) &&
                FocusStore.isDistractingApp(ctx, pkg)) {

            long now = System.currentTimeMillis();

            if (!lastFocusTrigger.containsKey(pkg) ||
                    now - lastFocusTrigger.get(pkg) > FOCUS_COOLDOWN) {

                lastFocusTrigger.put(pkg, now);

                sendFocusNotification(ctx, pkg);
                delayedClose(ctx);
            }

            return;
        }

        // ================= LIMIT LOCKED =================
        if (LimitStore.isLocked(ctx, pkg)) {
            immediateClose(ctx);
            return;
        }

        int limit = LimitStore.getLimit(ctx, pkg);
        if (limit <= 0) return;

        int usedToday = LimitStore.getTodayUsage(ctx, pkg);

        if (usedToday >= limit) {
            LimitStore.markLocked(ctx, pkg);
            sendLimitNotification(ctx, pkg);
            immediateClose(ctx);
        }
    }

    /* =========================================================
       RECORD + CHECK
       ========================================================= */

    public static void recordAndCheck(Context ctx, String pkg, int minutes) {

        if (pkg == null) return;

        if (FocusStore.isFocusActive(ctx) &&
                FocusStore.isDistractingApp(ctx, pkg)) {

            sendFocusNotification(ctx, pkg);
            delayedClose(ctx);
            return;
        }

        if (LimitStore.isLocked(ctx, pkg)) {
            immediateClose(ctx);
            return;
        }

        int limit = LimitStore.getLimit(ctx, pkg);
        if (limit <= 0) return;

        LimitStore.addUsage(ctx, pkg, minutes);

        int usedToday = LimitStore.getTodayUsage(ctx, pkg);

        if (usedToday >= limit) {
            LimitStore.markLocked(ctx, pkg);
            sendLimitNotification(ctx, pkg);
            immediateClose(ctx);
        }
    }

    /* =========================================================
       DELAYED CLOSE (FOCUS MODE)
       ========================================================= */

    private static void delayedClose(Context ctx) {

        handler.postDelayed(() -> {
            if (ctx instanceof AccessibilityService) {
                ((AccessibilityService) ctx)
                        .performGlobalAction(
                                AccessibilityService.GLOBAL_ACTION_HOME);
            }
        }, 7000); // 7 seconds
    }

    /* =========================================================
       IMMEDIATE CLOSE (LIMIT REACHED)
       ========================================================= */

    private static void immediateClose(Context ctx) {

        if (ctx instanceof AccessibilityService) {
            ((AccessibilityService) ctx)
                    .performGlobalAction(
                            AccessibilityService.GLOBAL_ACTION_HOME);
        }
    }

    /* =========================================================
       FOCUS NOTIFICATION
       ========================================================= */

    private static void sendFocusNotification(Context ctx, String pkg) {

        NotificationManager nm =
                (NotificationManager)
                        ctx.getSystemService(Context.NOTIFICATION_SERVICE);

        if (nm == null) return;

        Notification notification =
                new NotificationCompat.Builder(ctx, "DIGITALCALM_ALERTS")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle("Blocked During Focus Mode")
                        .setContentText("This app will close in a few seconds.")
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .build();

        nm.notify(("FOCUS_" + pkg).hashCode(), notification);
    }

    /* =========================================================
       LIMIT NOTIFICATION
       ========================================================= */

    private static void sendLimitNotification(Context ctx, String pkg) {

        NotificationManager nm =
                (NotificationManager)
                        ctx.getSystemService(Context.NOTIFICATION_SERVICE);

        if (nm == null) return;

        Notification notification =
                new NotificationCompat.Builder(ctx, "DIGITALCALM_ALERTS")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle("Daily Limit Reached")
                        .setContentText("This app has reached today's limit.")
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .build();

        nm.notify(pkg.hashCode(), notification);
    }
}