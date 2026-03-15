package com.anonymous.digitalcalmslapp.lock;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;

import com.anonymous.digitalcalmslapp.R;

public class AppBlockActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        setContentView(R.layout.activity_block);
    }

    @Override
    public void onBackPressed() {
        // Completely block back
    }

    @Override
    protected void onPause() {
        super.onPause();

        // If user tries to escape, reopen immediately
        if (!isFinishing()) {
            recreate();
        }
    }
}
