package com.jee.studyguardian.filters

data class YouTubeCheckResult(
    val shouldBlock: Boolean,
    val reason: String,
    val matchedRule: String
)

/**
 * Honest YouTube Distraction Control Engine.
 *
 * Technical Transparency:
 * Android does not provide a public API to inspect encrypted network streams or internal
 * recommendation feeds inside the official YouTube app. During active Focus Sessions with
 * Usage Access enabled, FocusGuardianForegroundService triggers whole-app YouTube shielding
 * whenever "Block YouTube During Focus" is active, and evaluates study titles/keywords on-device.
 */
object YouTubeFilterEngine {

    const val YOUTUBE_PACKAGE = "com.google.android.youtube"

    private val shortsViewIdHints = listOf(
        "reel_watch_fragment",
        "reel_recycler",
        "shorts_pivot_bar",
        "shorts_player"
    )

    fun evaluateYouTubeWindow(
        filterEnabled: Boolean,
        blockWholeApp: Boolean,
        blockShorts: Boolean,
        blockedKeywordsCsv: String,
        visibleScreenText: String,
        visibleViewIds: List<String>
    ): YouTubeCheckResult {
        if (!filterEnabled) {
            return YouTubeCheckResult(false, "Filter disabled", "")
        }

        if (blockWholeApp) {
            return YouTubeCheckResult(
                shouldBlock = true,
                reason = "Whole-app YouTube blocking is enabled for your Study Focus session.",
                matchedRule = "WHOLE_APP_YOUTUBE_BLOCK"
            )
        }

        if (blockShorts) {
            val matchedShortsId = visibleViewIds.firstOrNull { viewId ->
                shortsViewIdHints.any { hint -> viewId.contains(hint, ignoreCase = true) }
            }
            val mentionsShorts = visibleScreenText.contains("shorts", ignoreCase = true) &&
                (visibleScreenText.contains("remix", ignoreCase = true) ||
                    visibleScreenText.contains("subscribe", ignoreCase = true))

            if (matchedShortsId != null || mentionsShorts) {
                return YouTubeCheckResult(
                    shouldBlock = true,
                    reason = "YouTube Shorts distraction view detected.",
                    matchedRule = "SHORTS_FILTER"
                )
            }
        }

        val keywords = blockedKeywordsCsv
            .split(",")
            .map { it.trim().lowercase() }
            .filter { it.length >= 2 }

        val normalizedText = visibleScreenText.lowercase()
        val matchedKeyword = keywords.firstOrNull { kw -> normalizedText.contains(kw) }

        if (matchedKeyword != null) {
            return YouTubeCheckResult(
                shouldBlock = true,
                reason = "Matched blocked YouTube keyword: \"$matchedKeyword\"",
                matchedRule = "KEYWORD:$matchedKeyword"
            )
        }

        return YouTubeCheckResult(false, "Allowed study context", "")
    }
}
