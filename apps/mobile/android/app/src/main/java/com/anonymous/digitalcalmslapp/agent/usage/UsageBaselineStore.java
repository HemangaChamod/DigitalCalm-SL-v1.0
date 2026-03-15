package com.anonymous.digitalcalmslapp.agent.usage;

import android.content.Context;
import android.content.SharedPreferences;

public class UsageBaselineStore {

    private static final String PREF = "usage_baseline";
    private static final int WINDOW_DAYS = 7;

    /* ================= RECORD TODAY ================= */

    public static void recordTotal(Context ctx, long mins) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long today = java.time.LocalDate.now().toEpochDay();
        long todayTotal = p.getLong("TODAY_" + today, 0);

        p.edit()
                .putLong("TODAY_" + today, todayTotal + mins)
                .apply();
    }

    public static long getTodayTotalUsage(Context ctx) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long today = java.time.LocalDate.now().toEpochDay();

        return p.getLong("TODAY_" + today, 0);
    }

    /* ================= DAILY ROLLOVER ================= */

    public static void rolloverDay(Context ctx) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long today = java.time.LocalDate.now().toEpochDay();
        long yesterday = today - 1;

        long yesterdayTotal = p.getLong("TODAY_" + yesterday, 0);

        if (yesterdayTotal > 0) {

            // Shift window (drop oldest)
            for (int i = WINDOW_DAYS - 1; i > 0; i--) {
                long val = p.getLong("ROLL_" + (i - 1), 0);
                p.edit().putLong("ROLL_" + i, val).apply();
            }

            // Store yesterday as newest entry
            p.edit().putLong("ROLL_0", yesterdayTotal).apply();
        }
    }

    /* ================= GET 7-DAY AVERAGE ================= */

    public static long getAverageDailyUsage(Context ctx) {

        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        long sum = 0;
        int count = 0;

        for (int i = 0; i < WINDOW_DAYS; i++) {
            long val = p.getLong("ROLL_" + i, 0);
            if (val > 0) {
                sum += val;
                count++;
            }
        }

        return count == 0 ? 0 : sum / count;
    }
}