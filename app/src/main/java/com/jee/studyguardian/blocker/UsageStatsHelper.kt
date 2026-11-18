package com.jee.studyguardian.blocker

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Process
import com.jee.studyguardian.database.BlockedAppEntity
import com.jee.studyguardian.models.InstalledAppInfo
import java.util.Calendar

object UsageStatsHelper {

    fun hasUsageStatsPermission(context: Context): Boolean {
        return runCatching {
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
            mode == AppOpsManager.MODE_ALLOWED
        }.getOrDefault(false)
    }

    fun getCurrentForegroundPackage(context: Context): String? {
        if (!hasUsageStatsPermission(context)) return null
        return runCatching {
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val now = System.currentTimeMillis()
            val events = usm.queryEvents(now - 10_000L, now) ?: return null
            val event = UsageEvents.Event()
            var latestPkg: String? = null
            var latestTime = 0L
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val isForegroundEvent = event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                    @Suppress("DEPRECATION")
                    (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND)
                if (isForegroundEvent && event.timeStamp >= latestTime && !event.packageName.isNullOrBlank()) {
                    latestTime = event.timeStamp
                    latestPkg = event.packageName
                }
            }
            latestPkg
        }.getOrNull()
    }

    fun getDailyUsageMinutesMap(context: Context): Map<String, Int> {
        if (!hasUsageStatsPermission(context)) return emptyMap()
        return runCatching {
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val cal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                cal.timeInMillis,
                System.currentTimeMillis()
            ).orEmpty()

            val result = mutableMapOf<String, Int>()
            for (stat in stats) {
                val mins = (stat.totalTimeInForeground / 60_000L).toInt()
                if (mins > 0) {
                    result[stat.packageName] = (result[stat.packageName] ?: 0) + mins
                }
            }
            result
        }.getOrDefault(emptyMap())
    }

    fun getInstalledUserApps(
        context: Context,
        blockedApps: List<BlockedAppEntity>
    ): List<InstalledAppInfo> {
        return runCatching {
            val pm = context.packageManager
            val usageMap = getDailyUsageMinutesMap(context)
            val blockedSet = blockedApps.filter { it.isEnabled }.map { it.packageName }.toSet()

            val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            val resolved = pm.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)
            val ownPackage = context.packageName

            resolved
                .mapNotNull { info ->
                    val pkg = info.activityInfo.packageName
                    if (pkg == ownPackage) return@mapNotNull null
                    val label = info.loadLabel(pm).toString()
                    InstalledAppInfo(
                        packageName = pkg,
                        appName = label,
                        isBlocked = pkg in blockedSet,
                        dailyMinutesUsed = usageMap[pkg] ?: 0
                    )
                }
                .distinctBy { it.packageName }
                .sortedWith(
                    compareByDescending<InstalledAppInfo> { it.isBlocked }
                        .thenByDescending { it.dailyMinutesUsed }
                        .thenBy { it.appName }
                )
        }.getOrDefault(emptyList())
    }
}
