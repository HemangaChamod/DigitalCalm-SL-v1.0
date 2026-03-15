package com.anonymous.digitalcalmslapp.agent;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.content.Context;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.anonymous.digitalcalmslapp.R;
import com.anonymous.digitalcalmslapp.agent.usage.SpikeDetector;
import com.anonymous.digitalcalmslapp.agent.usage.UsageReader;

public class AgentForegroundService extends Service {

    private Handler handler;
    private HandlerThread handlerThread;
    private BroadcastReceiver screenReceiver;

    @Override
    public void onCreate() {
        super.onCreate();

        NotificationHelper.createChannel(this);

        Notification notification =
                new NotificationCompat.Builder(this, NotificationHelper.CHANNEL_ID)
                        .setContentTitle("DigitalCalm")
                        .setContentText("Monitoring usage")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setOngoing(true)
                        .build();

        startForeground(1, notification);

        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {

                    // Reset session when screen turns off
                    SpikeDetector.resetSession(context);
                }
            }
        };

        IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, filter);

        // Use background thread instead of main thread
        handlerThread = new HandlerThread("DigitalCalmAgentThread");
        handlerThread.start();

        handler = new Handler(handlerThread.getLooper());

        handler.post(loopRunnable);
    }

    private final Runnable loopRunnable = new Runnable() {
        @Override
        public void run() {

            try {
                String pkg = UsageReader.getForegroundApp(AgentForegroundService.this);

                if (pkg != null) {
                    SpikeDetector.Result r =
                            SpikeDetector.check(AgentForegroundService.this, pkg);

                    if (r != null) {
                        NotificationHelper.notify(
                                AgentForegroundService.this,
                                r.message
                        );
                    }
                }

            } catch (Exception ignored) {}

            handler.postDelayed(this, 5000);
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (handler != null) handler.removeCallbacksAndMessages(null);
        if (handlerThread != null) handlerThread.quitSafely();
        if (screenReceiver != null) {
            unregisterReceiver(screenReceiver);
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
