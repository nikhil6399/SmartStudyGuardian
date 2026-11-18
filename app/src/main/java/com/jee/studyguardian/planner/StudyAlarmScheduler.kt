package com.jee.studyguardian.planner

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.jee.studyguardian.database.StudyAlarmEntity
import java.util.Calendar

object StudyAlarmScheduler {

    fun schedule(context: Context, alarm: StudyAlarmEntity) {
        if (!alarm.isEnabled) {
            cancel(context, alarm.id)
            return
        }
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val pendingIntent = buildPendingIntent(context, alarm)
        val triggerAtMillis = computeNextTriggerMillis(alarm)

        runCatching {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
        }
    }

    fun cancel(context: Context, alarmId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, StudyAlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }

    private fun buildPendingIntent(context: Context, alarm: StudyAlarmEntity): PendingIntent {
        val intent = Intent(context, StudyAlarmReceiver::class.java).apply {
            putExtra(StudyAlarmReceiver.EXTRA_ALARM_ID, alarm.id)
            putExtra(StudyAlarmReceiver.EXTRA_LABEL, alarm.label)
            putExtra(StudyAlarmReceiver.EXTRA_HOUR, alarm.hour)
            putExtra(StudyAlarmReceiver.EXTRA_MINUTE, alarm.minute)
            putExtra(StudyAlarmReceiver.EXTRA_DAYS_CSV, alarm.daysCsv)
            putExtra(StudyAlarmReceiver.EXTRA_SUBJECT, alarm.subject)
        }
        return PendingIntent.getBroadcast(
            context,
            alarm.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun computeNextTriggerMillis(alarm: StudyAlarmEntity): Long {
        val allowedDays = alarm.daysCsv
            .split(",")
            .mapNotNull { it.trim().toIntOrNull() }
            .toSet()

        val now = Calendar.getInstance()
        for (offset in 0..7) {
            val candidate = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, offset)
                set(Calendar.HOUR_OF_DAY, alarm.hour)
                set(Calendar.MINUTE, alarm.minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            if (candidate.timeInMillis <= now.timeInMillis) continue
            val isoDay = when (candidate.get(Calendar.DAY_OF_WEEK)) {
                Calendar.MONDAY -> 1
                Calendar.TUESDAY -> 2
                Calendar.WEDNESDAY -> 3
                Calendar.THURSDAY -> 4
                Calendar.FRIDAY -> 5
                Calendar.SATURDAY -> 6
                else -> 7
            }
            if (allowedDays.isEmpty() || isoDay in allowedDays) {
                return candidate.timeInMillis
            }
        }
        return Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, alarm.hour)
            set(Calendar.MINUTE, alarm.minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }
}
