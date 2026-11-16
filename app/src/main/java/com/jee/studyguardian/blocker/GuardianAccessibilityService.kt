package com.jee.studyguardian.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.jee.studyguardian.application.JeeStudyGuardianApp
import com.jee.studyguardian.database.FilterLogEntity
import com.jee.studyguardian.filters.AiContentFilterEngine
import com.jee.studyguardian.filters.YouTubeFilterEngine
import com.jee.studyguardian.ui.screens.BlockOverlayActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.Calendar

/**
 * Transparent, Google Play-compliant AccessibilityService.
 *
 * Strictly limited scope:
 * - Only checks the foreground package name when the user has enabled App Blocker or Focus Mode.
 * - Only inspects visible non-sensitive UI labels inside `com.google.android.youtube` when the
 *   user explicitly turns on YouTube Distraction Control.
 * - Never captures screenshots, never reads password fields (`isPassword`), and never logs private messages.
 */
class GuardianAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var lastOverlayTriggerMs = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val pkg = event?.packageName?.toString() ?: return
        if (pkg == packageName || pkg == "com.android.systemui") return

        val now = System.currentTimeMillis()
        if (now - lastOverlayTriggerMs < 1500L) return

        val rootNode = rootInActiveWindow

        serviceScope.launch {
            val container = (application as? JeeStudyGuardianApp)?.container ?: return@launch
            val prefs = container.preferencesManager.preferencesFlow.first()

            val focusActive = prefs.appBlockerEnabled &&
                prefs.focusPausedRemainingMs == 0L &&
                (prefs.focusEndEpochMs == 0L || prefs.focusEndEpochMs > now)

            val enabledBlockedApps = container.database.blockedAppDao().getEnabledOnce()
            val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            val matchedApp = enabledBlockedApps.firstOrNull { app ->
                app.packageName == pkg && isHourInSchedule(currentHour, app.scheduleStartHour, app.scheduleEndHour)
            }

            // 1. Check user-selected App Blocker
            if (focusActive && matchedApp != null) {
                lastOverlayTriggerMs = now
                container.database.blockedAppDao().incrementBlockCount(pkg)
                container.database.filterLogDao().insert(
                    FilterLogEntity(
                        source = "APP_BLOCKER",
                        summary = "Blocked launch of ${matchedApp.appName}",
                        matchedRule = pkg,
                        actionTaken = "BLOCKED",
                        timestampEpochMs = now
                    )
                )
                launchBlockShield(
                    blockedLabel = matchedApp.appName,
                    reason = "Study Focus Mode is active. Stay locked in on your JEE target!",
                    remainingMs = (prefs.focusEndEpochMs - now).coerceAtLeast(0L)
                )
                return@launch
            }

            // 2. Check YouTube Distraction Filter (only on YouTube package when enabled)
            if (pkg == YouTubeFilterEngine.YOUTUBE_PACKAGE && prefs.youtubeFilterEnabled) {
                val (visibleText, viewIds) = extractNonSensitiveLabels(rootNode)
                val ytResult = YouTubeFilterEngine.evaluateYouTubeWindow(
                    filterEnabled = prefs.youtubeFilterEnabled,
                    blockWholeApp = prefs.youtubeBlockWholeApp,
                    blockShorts = prefs.youtubeBlockShorts,
                    blockedKeywordsCsv = prefs.youtubeBlockedKeywords,
                    visibleScreenText = visibleText,
                    visibleViewIds = viewIds
                )

                if (ytResult.shouldBlock) {
                    lastOverlayTriggerMs = now
                    container.database.filterLogDao().insert(
                        FilterLogEntity(
                            source = "YOUTUBE_FILTER",
                            summary = ytResult.reason,
                            matchedRule = ytResult.matchedRule,
                            actionTaken = "BLOCKED",
                            timestampEpochMs = now
                        )
                    )
                    launchBlockShield(
                        blockedLabel = "YouTube Distraction",
                        reason = ytResult.reason,
                        remainingMs = (prefs.focusEndEpochMs - now).coerceAtLeast(0L)
                    )
                    return@launch
                }

                // 3. Optional AI-assisted distraction text check on public YouTube titles
                if (prefs.aiFilterEnabled && visibleText.isNotBlank()) {
                    val aiResult = AiContentFilterEngine.classifyText(
                        text = visibleText,
                        enabled = true,
                        strictness = prefs.aiFilterStrictness,
                        customKeywordsCsv = prefs.aiFilterKeywords,
                        enabledCategoriesCsv = prefs.aiFilterCategories
                    )
                    if (aiResult.isFlagged) {
                        lastOverlayTriggerMs = now
                        container.database.filterLogDao().insert(
                            FilterLogEntity(
                                source = "AI_CONTENT_FILTER",
                                summary = "${aiResult.category}: ${aiResult.matchedKeywords.joinToString()}",
                                matchedRule = aiResult.classificationType,
                                actionTaken = "BLOCKED",
                                timestampEpochMs = now
                            )
                        )
                        launchBlockShield(
                            blockedLabel = aiResult.category,
                            reason = aiResult.confidenceNote,
                            remainingMs = (prefs.focusEndEpochMs - now).coerceAtLeast(0L)
                        )
                    }
                }
            }
        }
    }

    private fun launchBlockShield(blockedLabel: String, reason: String, remainingMs: Long) {
        val intent = Intent(this, BlockOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra(BlockOverlayActivity.EXTRA_APP_NAME, blockedLabel)
            putExtra(BlockOverlayActivity.EXTRA_REASON, reason)
            putExtra(BlockOverlayActivity.EXTRA_REMAINING_MS, remainingMs)
        }
        startActivity(intent)
    }

    private fun extractNonSensitiveLabels(root: AccessibilityNodeInfo?): Pair<String, List<String>> {
        if (root == null) return "" to emptyList()
        val texts = mutableListOf<String>()
        val ids = mutableListOf<String>()
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        var visited = 0
        while (queue.isNotEmpty() && visited < 45) {
            val node = queue.removeFirst()
            visited++
            if (node.isPassword) continue
            node.viewIdResourceName?.let { ids.add(it) }
            node.text?.toString()?.takeIf { it.isNotBlank() && it.length <= 120 }?.let { texts.add(it) }
            node.contentDescription?.toString()?.takeIf { it.isNotBlank() && it.length <= 120 }?.let { texts.add(it) }
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { queue.add(it) }
            }
        }
        return texts.joinToString(" | ") to ids
    }

    private fun isHourInSchedule(currentHour: Int, startHour: Int, endHour: Int): Boolean {
        return if (startHour <= endHour) {
            currentHour in startHour..endHour
        } else {
            currentHour >= startHour || currentHour <= endHour
        }
    }

    override fun onInterrupt() {
        // Required override
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }
}
