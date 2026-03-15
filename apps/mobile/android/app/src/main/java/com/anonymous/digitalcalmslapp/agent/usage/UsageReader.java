package com.anonymous.digitalcalmslapp.agent.usage;

import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;

public class UsageReader {

    private static String lastApp = null;

    public static String getForegroundApp(Context ctx) {

        try {
            UsageStatsManager usm =
                    (UsageStatsManager)
                            ctx.getSystemService(Context.USAGE_STATS_SERVICE);

            if (usm == null) return null;

            long now = System.currentTimeMillis();

            UsageEvents events = usm.queryEvents(now - 10_000, now);
            if (events == null) return null;

            UsageEvents.Event e = new UsageEvents.Event();

            while (events.hasNextEvent()) {
                events.getNextEvent(e);

                if (e.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastApp = e.getPackageName();
                }
            }

            if (lastApp == null) return null;

            // Ignore own app
            if ("com.anonymous.digitalcalmslapp".equals(lastApp)) {
                return null;
            }

            return lastApp;

        } catch (Exception e) {
            return null;
        }
    }
}
