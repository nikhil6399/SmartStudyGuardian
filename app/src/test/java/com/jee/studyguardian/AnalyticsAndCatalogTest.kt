package com.jee.studyguardian

import com.jee.studyguardian.analytics.AnalyticsCalculator
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.models.Subject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AnalyticsAndCatalogTest {

    @Test
    fun catalog_questionsHaveValidCorrectOptionIndices() {
        JeeContentCatalog.questions.forEach { q ->
            assertTrue("Invalid option index for ${q.id}", q.correctOptionIndex in q.options.indices)
        }
    }

    @Test
    fun analyticsCalculator_aggregatesSubjectMinutesAndDetectsWeakChapters() {
        val progress = listOf(
            ChapterProgressEntity(chapterId = "phy_kinematics", isCompleted = true, revisionCount = 2, practiceAttempted = 10, practiceCorrect = 9),
            ChapterProgressEntity(chapterId = "che_thermo", isCompleted = false, revisionCount = 0, practiceAttempted = 10, practiceCorrect = 3)
        )
        val daily = listOf(
            DailyStudyStatEntity(dateIso = "2026-11-16", physicsMinutes = 90, chemistryMinutes = 45, mathMinutes = 60)
        )
        val tests = listOf(
            MockTestResultEntity(
                title = "Physics Test",
                track = "JEE Main",
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

        val subjectStats = AnalyticsCalculator.computeSubjectAnalytics(progress, daily, tests)
        val physics = subjectStats.first { it.subject == Subject.PHYSICS }
        assertEquals(90, physics.studyMinutesThisWeek)
        assertEquals(80f, physics.avgAccuracyPercent, 0.01f)

        val (weak, strong) = AnalyticsCalculator.detectWeakAndStrongChapters(progress)
        assertTrue(weak.any { it.chapterId == "che_thermo" })
        assertTrue(strong.any { it.chapterId == "phy_kinematics" })
    }
}
