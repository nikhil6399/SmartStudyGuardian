package com.jee.studyguardian.utils

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.jee.studyguardian.models.LanguageMode
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

object TimeFormatters {
    fun todayIso(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    fun formatHoursMinutes(totalMinutes: Int): String {
        val h = totalMinutes / 60
        val m = totalMinutes % 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }

    fun formatCountdownHms(totalSeconds: Long): String {
        val safe = totalSeconds.coerceAtLeast(0L)
        val h = safe / 3600
        val m = (safe % 3600) / 60
        val s = safe % 60
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
    }

    fun formatCountdownMmSs(totalSeconds: Int): String {
        val safe = totalSeconds.coerceAtLeast(0)
        val m = safe / 60
        val s = safe % 60
        return String.format(Locale.US, "%02d:%02d", m, s)
    }
}

object ClipboardHelper {
    fun copyText(context: Context, label: String, text: String) {
        val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        manager.setPrimaryClip(ClipData.newPlainText(label, text))
    }
}

object PermissionIntents {
    fun openUsageAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openAccessibilitySettings(context: Context) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openNotificationSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
            putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openAppDetailsSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}

object AppStrings {
    fun greeting(language: LanguageMode): String =
        if (language == LanguageMode.HINDI) "स्मार्ट पढ़ाई, बेहतर परिणाम" else "Focus Smart, Score High"

    fun navHome(language: LanguageMode) = if (language == LanguageMode.HINDI) "होम" else "Home"
    fun navTutor(language: LanguageMode) = if (language == LanguageMode.HINDI) "AI गुरु" else "AI Tutor"
    fun navPractice(language: LanguageMode) = if (language == LanguageMode.HINDI) "अभ्यास" else "Practice"
    fun navBlocker(language: LanguageMode) = if (language == LanguageMode.HINDI) "ब्लॉकर" else "Blocker"
    fun navSettings(language: LanguageMode) = if (language == LanguageMode.HINDI) "सेटिंग्स" else "Settings"
}
