package com.jee.studyguardian.blocker

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.jee.studyguardian.R
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.ui.MainActivity
import com.jee.studyguardian.utils.TimeFormatters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class FocusGuardianForegroundService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var timerJob: Job? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                timerJob?.cancel()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val endEpochMs = intent?.getLongExtra(EXTRA_END_EPOCH_MS, 0L) ?: 0L
                startForeground(NOTIFICATION_ID, buildNotification("Study Focus Shield Active"))
                startCountdownNotificationLoop(endEpochMs)
            }
        }
        return START_STICKY
    }

    private fun startCountdownNotificationLoop(endEpochMs: Long) {
        timerJob?.cancel()
        timerJob = scope.launch {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            while (true) {
                val remainingSec = ((endEpochMs - System.currentTimeMillis()) / 1000L).coerceAtLeast(0L)
                val statusText = if (endEpochMs > 0L) {
                    "Remaining: ${TimeFormatters.formatCountdownHms(remainingSec)}"
                } else {
                    "Distraction Blocker Active"
                }
                nm.notify(NOTIFICATION_ID, buildNotification(statusText))
                if (endEpochMs > 0L && remainingSec == 0L) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    break
                }
                delay(1000L)
            }
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, JeeStudyGuardianApp.CHANNEL_FOCUS_SERVICE)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("JEE Study Guardian Focus Mode")
            .setContentText(contentText)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val NOTIFICATION_ID = 4011
        const val ACTION_START = "com.jee.studyguardian.ACTION_START_FOCUS"
        const val ACTION_STOP = "com.jee.studyguardian.ACTION_STOP_FOCUS"
        const val EXTRA_END_EPOCH_MS = "extra_end_epoch_ms"

        fun start(context: Context, endEpochMs: Long) {
            val intent = Intent(context, FocusGuardianForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_END_EPOCH_MS, endEpochMs)
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, FocusGuardianForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
