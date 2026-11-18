package com.jee.studyguardian.blocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.planner.StudyAlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.Default).launch {
            try {
                val app = context.applicationContext as? JeeStudyGuardianApp ?: return@launch
                val prefs = app.container.preferencesManager.preferencesFlow.first()
                val now = System.currentTimeMillis()
                if (prefs.appBlockerEnabled && prefs.focusPausedRemainingMs == 0L && prefs.focusEndEpochMs > now) {
                    runCatching { FocusGuardianForegroundService.start(context, prefs.focusEndEpochMs) }
                }
                val alarms = app.container.database.studyAlarmDao().getEnabledOnce()
                alarms.forEach { runCatching { StudyAlarmScheduler.schedule(context, it) } }
            } catch (_: Throwable) {
                // Safe no-op if OS restricts background start on boot
            } finally {
                pendingResult.finish()
            }
        }
    }
}
