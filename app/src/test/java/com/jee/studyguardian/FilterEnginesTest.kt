package com.jee.studyguardian

import com.jee.studyguardian.analytics.AnalyticsCalculator
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.filters.AiContentFilterEngine
import com.jee.studyguardian.filters.YouTubeFilterEngine
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.FilterStrictness
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.utils.TimeFormatters
import org.junit.Assert.assertEquals
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
    fun aiFilter_blocksDistractingSocialAndGamingAppsInBalancedMode() {
        val ig = AiContentFilterEngine.classifyAppContext(
            appLabel = "Instagram",
            packageName = "com.instagram.android",
            enabled = true,
            strictness = FilterStrictness.BALANCED,
            customKeywordsCsv = "reel,gambling,nsfw",
            enabledCategoriesCsv = "Inappropriate Content,Social Distractions,Gaming & Betting"
        )
        assertTrue(ig.isFlagged)

        val bgmi = AiContentFilterEngine.classifyAppContext(
            appLabel = "Battlegrounds Mobile India",
            packageName = "com.pubg.imobile",
            enabled = true,
            strictness = FilterStrictness.BALANCED,
            customKeywordsCsv = "reel,gambling,nsfw",
            enabledCategoriesCsv = "Inappropriate Content,Social Distractions,Gaming & Betting"
        )
        assertTrue(bgmi.isFlagged)

        val notes = AiContentFilterEngine.classifyAppContext(
            appLabel = "NCERT Physics Notes",
            packageName = "com.ncert.physics.notes",
            enabled = true,
            strictness = FilterStrictness.BALANCED,
            customKeywordsCsv = "reel,gambling,nsfw",
            enabledCategoriesCsv = "Inappropriate Content,Social Distractions,Gaming & Betting"
        )
        assertFalse(notes.isFlagged)

        val disabled = AiContentFilterEngine.classifyText(
            text = "Instagram",
            enabled = false,
            strictness = FilterStrictness.STRICT,
            customKeywordsCsv = "",
            enabledCategoriesCsv = "Social Distractions"
        )
        assertFalse(disabled.isFlagged)
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

    @Test
    fun timeFormatters_formatDurationsAndCountdownsAccurately() {
        assertEquals("45m", TimeFormatters.formatHoursMinutes(45))
        assertEquals("2h 15m", TimeFormatters.formatHoursMinutes(135))
        assertEquals("01:05:09", TimeFormatters.formatCountdownHms(3909))
        assertEquals("00:00:00", TimeFormatters.formatCountdownHms(-10))
        assertEquals("25:00", TimeFormatters.formatCountdownMmSs(1500))
        assertEquals("00:00", TimeFormatters.formatCountdownMmSs(-5))
    }

    @Test
    fun analyticsCalculator_computesSubjectMasteryAndStrengths() {
        val progress = listOf(
            ChapterProgressEntity(
                chapterId = "phy_kinematics",
                isCompleted = true,
                practiceAttempted = 10,
                practiceCorrect = 9,
                revisionCount = 2
            ),
            ChapterProgressEntity(
                chapterId = "chem_thermo",
                isCompleted = false,
                practiceAttempted = 10,
                practiceCorrect = 3,
                revisionCount = 0
            )
        )
        val stats = listOf(
            DailyStudyStatEntity(
                dateIso = "2026-11-18",
                physicsMinutes = 90,
                chemistryMinutes = 45,
                mathMinutes = 60
            )
        )
        val tests = listOf(
            MockTestResultEntity(
                title = "Physics Test",
                track = "JEE_MAIN",
                subjectName = "Physics",
                totalQuestions = 10,
                attempted = 10,
                correct = 8,
                incorrect = 2,
                score = 30,
                maxScore = 40,
                accuracyPercent = 80f,
                durationTakenSeconds = 600
            )
        )

        val subjectStats = AnalyticsCalculator.computeSubjectAnalytics(
            progressList = progress,
            dailyStats = stats,
            testResults = tests,
            selectedTrack = ExamTrack.JEE_MAIN
        )
        assertEquals(3, subjectStats.size)
        val physics = subjectStats.first { it.subject == Subject.PHYSICS }
        assertEquals(90, physics.studyMinutesThisWeek)
        assertEquals(80f, physics.avgAccuracyPercent, 0.1f)
        assertEquals(1, physics.completedChapters)

        val (_, strong) = AnalyticsCalculator.detectWeakAndStrongChapters(
            progressList = progress,
            selectedTrack = ExamTrack.JEE_MAIN
        )
        assertTrue(strong.any { it.chapterId == "phy_kinematics" })
    }
}
