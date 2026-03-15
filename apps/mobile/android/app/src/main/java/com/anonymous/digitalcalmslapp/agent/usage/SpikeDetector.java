package com.anonymous.digitalcalmslapp.agent.usage;
import java.util.Set;

import android.content.Context;
import android.content.pm.ApplicationInfo;

import com.anonymous.digitalcalmslapp.limit.LimitEnforcer;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;

public class SpikeDetector {

    /* ---------------- SESSION STATE ---------------- */

    private static String activeApp = null;
    private static long sessionStart = 0;
    private static LocalDate currentDay = LocalDate.now();

    /* ---------------- DISTRACTION APPS (MVP Only) ---------------- */

    private static final Set<String> DISTRACTION_APPS = Set.of(
            "com.instagram.android",
            "com.facebook.katana",
            "com.zhiliaoapp.musically", // TikTok
            "com.snapchat.android",
            "com.whatsapp"
    );

    /* ---------------- GLOBAL DAILY CONTROL ---------------- */

    private static int dailyAlertCount = 0;
    private static final int MAX_ALERTS_PER_DAY = 10;

    /* ---------------- DEVICE OVERUSE ---------------- */

    private static boolean deviceAlertSentToday = false;

    /* ---------------- APP OVERUSE ESCALATION ---------------- */

    private static final HashMap<String, Integer> appEscalationLevel = new HashMap<>();

    /* ---------------- FREQUENT OPENS ---------------- */

    private static final HashMap<String, Integer> hourlyOpenCount = new HashMap<>();
    private static final HashMap<String, Long> firstOpenTimestamp = new HashMap<>();

    /* ---------------- LATE NIGHT ---------------- */

    private static boolean lateNightFirstSent = false;
    private static boolean lateNightSecondSent = false;

    /* ---------------- RESULT ---------------- */

    public static class Result {
        public final String message;
        Result(String m) { message = m; }
    }

    /* ---------------- MAIN CHECK ---------------- */

    public static Result check(Context ctx, String pkg) {

        long now = System.currentTimeMillis();
        LocalDate today = LocalDate.now();

        /* -------- DAILY RESET -------- */

        if (!today.equals(currentDay)) {

            UsageBaselineStore.rolloverDay(ctx);

            currentDay = today;
            dailyAlertCount = 0;
            deviceAlertSentToday = false;
            lateNightFirstSent = false;
            lateNightSecondSent = false;

            hourlyOpenCount.clear();
            firstOpenTimestamp.clear();
            appEscalationLevel.clear();
        }

        /* -------- GLOBAL DAILY CAP -------- */

        if (dailyAlertCount >= MAX_ALERTS_PER_DAY) {
            return null;
        }

        /* -------- IGNORE SYSTEM APPS -------- */

        if (pkg == null || isSystemOrLauncher(ctx, pkg)) {
            return null;
        }

        /* -------- APP SWITCH -------- */

        if (!pkg.equals(activeApp)) {

            if (activeApp != null) {
                long mins = (now - sessionStart) / 60000;

                if (mins > 0) {
                    UsageBaselineStore.recordTotal(ctx, mins);
                    LimitEnforcer.recordAndCheck(ctx, activeApp, (int) mins);
                }

                appEscalationLevel.remove(activeApp);
            }

            activeApp = pkg;
            sessionStart = now;

            // Track frequent opens
            long firstTime = firstOpenTimestamp.getOrDefault(pkg, now);

            if (now - firstTime > 60 * 60 * 1000) {
                firstTime = now;
                hourlyOpenCount.put(pkg, 0);
            }

            firstOpenTimestamp.put(pkg, firstTime);
            hourlyOpenCount.put(pkg,
                    hourlyOpenCount.getOrDefault(pkg, 0) + 1);

            return null;
        }

        /* -------- ACTIVE SESSION -------- */

        long sessionMinutes = (now - sessionStart) / 60000;
        LimitEnforcer.enforceIfNeeded(ctx, pkg);
        String appName = getAppName(ctx, pkg);

        /* ================= DEVICE OVERUSE ================= */

        long avgDaily = UsageBaselineStore.getAverageDailyUsage(ctx);
        long todayTotal = UsageBaselineStore.getTodayTotalUsage(ctx);

        if (!deviceAlertSentToday &&
                avgDaily > 0 &&
                todayTotal >= avgDaily + 60) {

            deviceAlertSentToday = true;
            dailyAlertCount++;

            return new Result(
                    "You’ve used your device today about 1 hour more than usual."
            );
        }

        /* ================= APP OVERUSE (DISTRACTION ONLY) ================= */

        if (DISTRACTION_APPS.contains(pkg)) {

            int level = appEscalationLevel.getOrDefault(pkg, 0);

            if (sessionMinutes >= 60 && level < 3) {
                appEscalationLevel.put(pkg, 3);
                dailyAlertCount++;
                return new Result("You’ve been on " + appName + " for 1 hour continuously.");
            }

            if (sessionMinutes >= 45 && level < 2) {
                appEscalationLevel.put(pkg, 2);
                dailyAlertCount++;
                return new Result("You’ve been on " + appName + " for 45 minutes. Consider taking a short break.");
            }

            if (sessionMinutes >= 30 && level < 1) {
                appEscalationLevel.put(pkg, 1);
                dailyAlertCount++;
                return new Result("You’ve been on " + appName + " for 30 minutes.");
            }
        }

        /* ================= FREQUENT OPENS ================= */

        if (hourlyOpenCount.getOrDefault(pkg, 0) >= 6) {
            hourlyOpenCount.put(pkg, 0);
            dailyAlertCount++;

            return new Result(
                    "You’ve opened " + appName + " several times in the last hour."
            );
        }

        /* ================= LATE NIGHT ================= */

        LocalTime time = LocalTime.now();
        int hour = time.getHour();

        if (hour >= 23) {

            if (!lateNightFirstSent && sessionMinutes >= 10) {
                lateNightFirstSent = true;
                dailyAlertCount++;
                return new Result("It’s late. Staying up affects your sleep.");
            }

            if (!lateNightSecondSent && sessionMinutes >= 30) {
                lateNightSecondSent = true;
                dailyAlertCount++;
                return new Result("You’re still active late at night. Consider resting.");
            }
        }

        return null;
    }

    /* ---------------- HELPERS ---------------- */

    private static boolean isSystemOrLauncher(Context ctx, String pkg) {
        try {
            ApplicationInfo ai =
                    ctx.getPackageManager().getApplicationInfo(pkg, 0);

            if ((ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0) return true;
            if ((ai.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0) return true;

            return pkg.contains("launcher")
                    || pkg.contains("systemui")
                    || pkg.startsWith("com.android.")
                    || pkg.startsWith("com.google.android.");

        } catch (Exception e) {
            return true;
        }
    }

    private static String getAppName(Context ctx, String pkg) {
        try {
            return ctx.getPackageManager()
                    .getApplicationLabel(
                            ctx.getPackageManager()
                                    .getApplicationInfo(pkg, 0)
                    ).toString();
        } catch (Exception e) {
            return pkg.substring(pkg.lastIndexOf('.') + 1);
        }
    }
    
    /* ---------------- SESSION RESET (SCREEN OFF) ---------------- */

    public static void resetSession(Context ctx) {

        if (activeApp != null && sessionStart > 0) {

            long now = System.currentTimeMillis();
            long mins = (now - sessionStart) / 60000;

            if (mins > 0) {
                UsageBaselineStore.recordTotal(ctx, mins);
                LimitEnforcer.recordAndCheck(ctx, activeApp, (int) mins);
            }
        }

        activeApp = null;
        sessionStart = 0;
        appEscalationLevel.clear();
    }
}