package com.anonymous.digitalcalmslapp.limit;

import android.content.Context;
import android.content.SharedPreferences;

import java.time.LocalDate;

public class LimitStore {

    private static final String PREF = "app_limits";

    private static String todayKey() {
        return LocalDate.now().toString();
    }

    /* ================= LIMIT ================= */

    public static void setLimit(Context ctx, String pkg, int minutes) {
        SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        p.edit().putInt(pkg + "_limit", minutes).apply();
    }

    public static int getLimit(Context ctx, String pkg) {
        SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        return p.getInt(pkg + "_limit", 0);
    }

    /* ================= USAGE ================= */

    public static void addUsage(Context ctx, String pkg, int minutes) {
        SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        String key = todayKey() + "_" + pkg + "_used";

        int current = p.getInt(key, 0);
        p.edit().putInt(key, current + minutes).apply();
    }

    public static int getTodayUsage(Context ctx, String pkg) {
        SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        return p.getInt(todayKey() + "_" + pkg + "_used", 0);
    }

    public static void clearTodayUsage(Context ctx, String pkg) {
        SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        p.edit().remove(todayKey() + "_" + pkg + "_used").apply();
    }

    /* ================= 24H LOCK ================= */

    public static void markLocked(Context ctx, String pkg) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long lockUntil =
                System.currentTimeMillis() + (24L * 60 * 60 * 1000);

        p.edit()
                .putLong(pkg + "_lock_until", lockUntil)
                .apply();
    }

    public static boolean isLocked(Context ctx, String pkg) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long lockUntil =
                p.getLong(pkg + "_lock_until", 0);

        return System.currentTimeMillis() < lockUntil;
    }

    public static long getLockRemaining(Context ctx, String pkg) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long lockUntil =
                p.getLong(pkg + "_lock_until", 0);

        long remaining = lockUntil - System.currentTimeMillis();

        return Math.max(remaining, 0);
    }
}
