package com.jee.studyguardian.blocker

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.jee.studyguardian.R
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.database.FilterLogEntity
import com.jee.studyguardian.filters.AiContentFilterEngine
import com.jee.studyguardian.filters.YouTubeFilterEngine
import com.jee.studyguardian.ui.MainActivity
import com.jee.studyguardian.ui.screens.BlockOverlayActivity
import com.jee.studyguardian.utils.TimeFormatters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.Calendar

class FocusGuardianForegroundService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var timerJob: Job? = null
    private var lastAlertEpochMs = 0L

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                timerJob?.cancel()
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val endEpochMs = intent?.getLongExtra(EXTRA_END_EPOCH_MS, 0L) ?: 0L
                val fgType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                } else {
                    0
                }
                ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    buildNotification("Study Focus Shield Active"),
                    fgType
                )
                startCountdownNotificationLoop(endEpochMs)
            }
        }
        return START_STICKY
    }

    private fun startCountdownNotificationLoop(endEpochMs: Long) {
        timerJob?.cancel()
        timerJob = scope.launch {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            var tickCount = 0
            while (true) {
                val now = System.currentTimeMillis()
                val remainingSec = ((endEpochMs - now) / 1000L).coerceAtLeast(0L)
                val statusText = if (endEpochMs > 0L) {
                    "Remaining: ${TimeFormatters.formatCountdownHms(remainingSec)}"
                } else {
                    "Distraction Blocker Active"
                }
                nm.notify(NOTIFICATION_ID, buildNotification(statusText))
                if (endEpochMs > 0L && remainingSec == 0L) {
                    ServiceCompat.stopForeground(
                        this@FocusGuardianForegroundService,
                        ServiceCompat.STOP_FOREGROUND_REMOVE
                    )
                    stopSelf()
                    break
                }

                if (tickCount % 2 == 0) {
                    runCatching { checkForegroundDistraction(now, endEpochMs) }
                }
                tickCount++
                delay(1000L)
            }
        }
    }

    private suspend fun checkForegroundDistraction(now: Long, endEpochMs: Long) {
        if (now - lastAlertEpochMs < 4000L) return
        val pkg = UsageStatsHelper.getCurrentForegroundPackage(this) ?: return
        if (pkg == packageName ||
            pkg == "com.android.systemui" ||
            pkg == "com.android.settings" ||
            pkg == "com.android.packageinstaller" ||
            pkg == "com.google.android.packageinstaller"
        ) {
            return
        }
        if (pkg in UsageStatsHelper.getLauncherPackages(this)) return

        val app = application as? JeeStudyGuardianApp ?: return
        val container = app.container
        val prefs = container.preferencesManager.preferencesFlow.first()
        val focusActive = prefs.appBlockerEnabled &&
            prefs.focusPausedRemainingMs == 0L &&
            (prefs.focusEndEpochMs == 0L || prefs.focusEndEpochMs > now)
        if (!focusActive) return

        val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val matchedApp = container.database.blockedAppDao().getEnabledOnce().firstOrNull { entity ->
            entity.packageName == pkg && isHourInSchedule(currentHour, entity.scheduleStartHour, entity.scheduleEndHour)
        }

        val isBlockedYouTube = pkg == YouTubeFilterEngine.YOUTUBE_PACKAGE &&
            prefs.youtubeFilterEnabled &&
            prefs.youtubeBlockWholeApp

        val appLabel = UsageStatsHelper.getAppLabel(this, pkg)
        val aiCheck = if (matchedApp == null &&
            !isBlockedYouTube &&
            pkg != YouTubeFilterEngine.YOUTUBE_PACKAGE &&
            prefs.aiFilterEnabled
        ) {
            AiContentFilterEngine.classifyAppContext(
                appLabel = appLabel,
                packageName = pkg,
                enabled = prefs.aiFilterEnabled,
                strictness = prefs.aiFilterStrictness,
                customKeywordsCsv = prefs.aiFilterKeywords,
                enabledCategoriesCsv = prefs.aiFilterCategories
            )
        } else {
            null
        }

        val isAiBlocked = aiCheck?.isFlagged == true
        if (matchedApp == null && !isBlockedYouTube && !isAiBlocked) return

        lastAlertEpochMs = now
        val label = matchedApp?.appName ?: if (isBlockedYouTube) "YouTube" else appLabel
        val reason = when {
            isBlockedYouTube -> "Whole-app YouTube blocking is enabled for your Study Focus session."
            isAiBlocked -> "AI Content Filter detected ${aiCheck?.category} ($appLabel). Stay focused on JEE study!"
            else -> "Study Focus Mode is active. Stay locked in on your study goal!"
        }

        if (matchedApp != null) {
            container.database.blockedAppDao().incrementBlockCount(pkg)
        }
        val logSource = when {
            isBlockedYouTube -> "YOUTUBE_FILTER"
            isAiBlocked -> "AI_CONTENT_FILTER"
            else -> "APP_BLOCKER"
        }
        val logSummary = when {
            isAiBlocked -> "AI Shield blocked $label (${aiCheck?.matchedKeywords?.joinToString().orEmpty()})"
            else -> "Focus reminder triggered for $label"
        }
        container.database.filterLogDao().insert(
            FilterLogEntity(
                source = logSource,
                summary = logSummary,
                matchedRule = if (isAiBlocked) (aiCheck?.classificationType ?: pkg) else pkg,
                actionTaken = "BLOCKED",
                timestampEpochMs = now
            )
        )

        val remainingMs = (endEpochMs - now).coerceAtLeast(0L)
        val overlayIntent = Intent(this, BlockOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra(BlockOverlayActivity.EXTRA_APP_NAME, label)
            putExtra(BlockOverlayActivity.EXTRA_REASON, reason)
            putExtra(BlockOverlayActivity.EXTRA_REMAINING_MS, remainingMs)
        }

        // Post high-priority reminder notification (always permitted on Android 10–15 even under BAL limits)
        val canNotify = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        if (canNotify) {
            val tapIntent = PendingIntent.getActivity(
                this,
                4012,
                overlayIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            val alert = NotificationCompat.Builder(this, JeeStudyGuardianApp.CHANNEL_REMINDERS)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("Focus Mode Active · $label Blocked")
                .setContentText(reason)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(tapIntent)
                .build()
            NotificationManagerCompat.from(this).notify(4012, alert)
        }

        runCatching { startActivity(overlayIntent) }
    }

    private fun isHourInSchedule(currentHour: Int, startHour: Int, endHour: Int): Boolean {
        return if (startHour <= endHour) {
            currentHour in startHour..endHour
        } else {
            currentHour >= startHour || currentHour <= endHour
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
            runCatching {
                val intent = Intent(context, FocusGuardianForegroundService::class.java).apply {
                    action = ACTION_START
                    putExtra(EXTRA_END_EPOCH_MS, endEpochMs)
                }
                context.startForegroundService(intent)
            }
        }

        fun stop(context: Context) {
            runCatching {
                val intent = Intent(context, FocusGuardianForegroundService::class.java)
                context.stopService(intent)
            }
        }
    }
}
