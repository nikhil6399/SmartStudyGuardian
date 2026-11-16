package com.jee.studyguardian.planner

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.RingtoneManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.jee.studyguardian.R
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.database.StudyAlarmEntity
import com.jee.studyguardian.ui.MainActivity
import java.util.Locale

class StudyAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getLongExtra(EXTRA_ALARM_ID, 0L)
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "Study & Revision Alarm"
        val hour = intent.getIntExtra(EXTRA_HOUR, 6)
        val minute = intent.getIntExtra(EXTRA_MINUTE, 30)
        val daysCsv = intent.getStringExtra(EXTRA_DAYS_CSV) ?: ""
        val subject = intent.getStringExtra(EXTRA_SUBJECT) ?: "PHYSICS"

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            alarmId.toInt(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val period = if (hour >= 12) "PM" else "AM"
        val hour12 = if (hour % 12 == 0) 12 else hour % 12
        val formattedTime = String.format(Locale.US, "%02d:%02d %s", hour12, minute, period)

        val canPost = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED

        if (canPost) {
            val notification = NotificationCompat.Builder(context, JeeStudyGuardianApp.CHANNEL_REMINDERS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Study Alarm · $formattedTime")
                .setContentText("$label ($subject)")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(alarmSound)
                .setAutoCancel(true)
                .setContentIntent(contentPendingIntent)
                .build()
            NotificationManagerCompat.from(context).notify((3000 + alarmId).toInt(), notification)
        }

        if (alarmId > 0L) {
            StudyAlarmScheduler.schedule(
                context,
                StudyAlarmEntity(
                    id = alarmId,
                    hour = hour,
                    minute = minute,
                    label = label,
                    daysCsv = daysCsv,
                    isEnabled = true,
                    subject = subject
                )
            )
        }
    }

    companion object {
        const val EXTRA_ALARM_ID = "extra_alarm_id"
        const val EXTRA_LABEL = "extra_label"
        const val EXTRA_HOUR = "extra_hour"
        const val EXTRA_MINUTE = "extra_minute"
        const val EXTRA_DAYS_CSV = "extra_days_csv"
        const val EXTRA_SUBJECT = "extra_subject"
    }
}
