package com.jee.studyguardian.planner

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.jee.studyguardian.R
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.ui.MainActivity
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

class StudyReminderWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? JeeStudyGuardianApp ?: return Result.success()
        val prefs = app.container.preferencesManager.preferencesFlow.first()
        if (!prefs.notificationsEnabled) return Result.success()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return Result.success()
        }

        val progress = app.container.database.chapterProgressDao().getAllOnce().associateBy { it.chapterId }
        val nextChapter = JeeContentCatalog.chapters.firstOrNull { progress[it.id]?.isCompleted != true }
            ?: JeeContentCatalog.chapters.first()

        val intent = Intent(applicationContext, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            12,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(applicationContext, JeeStudyGuardianApp.CHANNEL_REMINDERS)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Daily JEE Revision Reminder")
            .setContentText("Next target: ${nextChapter.title} (${nextChapter.subject.labelEn})")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(applicationContext).notify(5001, notification)
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "jee_daily_revision_reminder"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<StudyReminderWorker>(12, TimeUnit.HOURS).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
