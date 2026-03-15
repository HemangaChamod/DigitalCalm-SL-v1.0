package com.anonymous.digitalcalmslapp.agent;

import android.app.*;
import android.content.Context;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.anonymous.digitalcalmslapp.R;

public class NotificationHelper {

    public static final String CHANNEL_ID = "DIGITALCALM_ALERTS";
    private static boolean channelCreated = false;

    public static void createChannel(Context ctx) {
        if (channelCreated) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel =
                new NotificationChannel(
                    CHANNEL_ID,
                    "DigitalCalm Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );

            channel.setDescription("Real-time digital wellbeing alerts");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 400, 200, 400});
            channel.setSound(null, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager nm =
                (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.createNotificationChannel(channel);
        }

        channelCreated = true;
    }

    public static void notify(Context ctx, String message) {
        createChannel(ctx);

        Notification n =
            new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("DigitalCalm")
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_VIBRATE)
                .setAutoCancel(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();

        NotificationManager nm =
            (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);

        nm.notify((int) System.currentTimeMillis(), n);
    }
}
