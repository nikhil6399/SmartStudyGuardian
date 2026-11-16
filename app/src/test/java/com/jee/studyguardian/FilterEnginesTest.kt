package com.jee.studyguardian

import com.jee.studyguardian.filters.AiContentFilterEngine
import com.jee.studyguardian.filters.YouTubeFilterEngine
import com.jee.studyguardian.models.FilterStrictness
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FilterEnginesTest {

    @Test
    fun aiFilter_flagsInappropriateContentRegardlessOfRelaxedMode() {
        val result = AiContentFilterEngine.classifyText(
            text = "Best online casino betting strategy",
            enabled = true,
            strictness = FilterStrictness.RELAXED,
            customKeywordsCsv = "",
            enabledCategoriesCsv = "Inappropriate Content,Social Distractions"
        )
        assertTrue(result.isFlagged)
        assertTrue(result.classificationType.contains("Inappropriate"))
    }

    @Test
    fun aiFilter_allowsCleanPhysicsStudyContent() {
        val result = AiContentFilterEngine.classifyText(
            text = "Gauss law electric flux through symmetric cylinder derivation",
            enabled = true,
            strictness = FilterStrictness.STRICT,
            customKeywordsCsv = "reel,gaming",
            enabledCategoriesCsv = "Inappropriate Content,Social Distractions"
        )
        assertFalse(result.isFlagged)
    }

    @Test
    fun youtubeFilter_detectsShortsViewIdAndKeywords() {
        val shortsCheck = YouTubeFilterEngine.evaluateYouTubeWindow(
            filterEnabled = true,
            blockWholeApp = false,
            blockShorts = true,
            blockedKeywordsCsv = "gaming,prank",
            visibleScreenText = "Trending Video",
            visibleViewIds = listOf("com.google.android.youtube:id/reel_watch_fragment")
        )
        assertTrue(shortsCheck.shouldBlock)

        val studyCheck = YouTubeFilterEngine.evaluateYouTubeWindow(
            filterEnabled = true,
            blockWholeApp = false,
            blockShorts = true,
            blockedKeywordsCsv = "gaming,prank",
            visibleScreenText = "Rotational Motion One Shot JEE Advanced Physics",
            visibleViewIds = listOf("com.google.android.youtube:id/watch_player")
        )
        assertFalse(studyCheck.shouldBlock)
    }
}
