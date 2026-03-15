package com.anonymous.digitalcalmslapp.focus;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class FocusStore {

    private static final String PREF = "focus_store";
    private static final String KEY_ACTIVE = "focus_active";
    private static final String KEY_APPS = "distracting_apps";
    private static final String KEY_SCHEDULES = "focus_schedules";

    /* ===================== FOCUS ACTIVE ===================== */

    public static void setFocusActive(Context ctx, boolean active) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        p.edit().putBoolean(KEY_ACTIVE, active).apply();
    }

    public static boolean isFocusActive(Context ctx) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        return p.getBoolean(KEY_ACTIVE, false);
    }

    /* ===================== DISTRACTING APPS ===================== */

    public static void setDistractingApps(Context ctx, Set<String> apps) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        // Always save a new copy (avoid reference issues)
        p.edit().putStringSet(KEY_APPS, new HashSet<>(apps)).apply();
    }

    public static Set<String> getDistractingApps(Context ctx) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        Set<String> stored =
                p.getStringSet(KEY_APPS, new HashSet<>());

        // Return defensive copy
        return new HashSet<>(stored);
    }

    public static boolean isDistractingApp(Context ctx, String pkg) {
        return getDistractingApps(ctx).contains(pkg);
    }

    /* ===================== SCHEDULE STORAGE ===================== */

    public static void setSchedules(Context ctx, JSONArray schedules) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        p.edit().putString(KEY_SCHEDULES,
                schedules.toString()).apply();
    }

    public static JSONArray getSchedules(Context ctx) {
        SharedPreferences p =
                ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);

        String json = p.getString(KEY_SCHEDULES, "[]");

        try {
            return new JSONArray(json);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    /* ===================== SCHEDULE EVALUATION ===================== */

    public static boolean isScheduleActive(Context ctx) {

        JSONArray schedules = getSchedules(ctx);

        LocalDateTime now = LocalDateTime.now();
        LocalTime currentTime = now.toLocalTime();

        // Normalize day format to "Mon", "Tue", etc.
        String today = now.getDayOfWeek()
                .getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH);

        for (int i = 0; i < schedules.length(); i++) {
            try {
                JSONObject obj = schedules.getJSONObject(i);

                if (!obj.optBoolean("enabled", false))
                    continue;

                JSONArray days = obj.getJSONArray("days");

                boolean dayMatch = false;

                for (int d = 0; d < days.length(); d++) {
                    if (days.getString(d)
                            .equalsIgnoreCase(today)) {
                        dayMatch = true;
                        break;
                    }
                }

                if (!dayMatch)
                    continue;

                LocalTime start =
                        LocalTime.parse(obj.getString("start"));

                LocalTime end =
                        LocalTime.parse(obj.getString("end"));

                if (start.isBefore(end)) {

                    if (!currentTime.isBefore(start)
                            && !currentTime.isAfter(end)) {
                        return true;
                    }

                } else {

                    // Overnight schedule (e.g., 22:00 → 06:00)

                    if (!currentTime.isBefore(start)
                            || !currentTime.isAfter(end)) {
                        return true;
                    }
                }

            } catch (Exception ignored) {}
        }

        return false;
    }
}