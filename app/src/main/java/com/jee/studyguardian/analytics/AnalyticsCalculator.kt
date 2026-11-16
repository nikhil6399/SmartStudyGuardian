package com.jee.studyguardian.analytics

import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.models.ChapterStrength
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.models.SubjectAnalytics

object AnalyticsCalculator {

    fun computeSubjectAnalytics(
        progressList: List<ChapterProgressEntity>,
        dailyStats: List<DailyStudyStatEntity>,
        testResults: List<MockTestResultEntity>,
        selectedTrack: ExamTrack? = null
    ): List<SubjectAnalytics> {
        val progressMap = progressList.associateBy { it.chapterId }
        val last7Days = dailyStats.take(7)

        return Subject.entries.map { subject ->
            val trackSubjectChapters = if (selectedTrack != null) {
                JeeContentCatalog.chapters.filter { it.subject == subject && it.track == selectedTrack }
            } else {
                emptyList()
            }
            val subjectChapters = if (trackSubjectChapters.isNotEmpty()) {
                trackSubjectChapters
            } else {
                JeeContentCatalog.chapters.filter { it.subject == subject }
            }
            val completedCount = subjectChapters.count { ch -> progressMap[ch.id]?.isCompleted == true }

            val weeklyMinutes = when (subject) {
                Subject.PHYSICS -> last7Days.sumOf { it.physicsMinutes }
                Subject.CHEMISTRY -> last7Days.sumOf { it.chemistryMinutes }
                Subject.MATHEMATICS -> last7Days.sumOf { it.mathMinutes }
            }

            val subjectTests = testResults.filter {
                it.subjectName.equals(subject.name, ignoreCase = true) ||
                    it.subjectName.equals(subject.labelEn, ignoreCase = true)
            }
            val avgAccuracy = if (subjectTests.isNotEmpty()) {
                subjectTests.map { it.accuracyPercent }.average().toFloat()
            } else {
                val attempted = subjectChapters.sumOf { progressMap[it.id]?.practiceAttempted ?: 0 }
                val correct = subjectChapters.sumOf { progressMap[it.id]?.practiceCorrect ?: 0 }
                if (attempted > 0) (correct * 100f / attempted) else 0f
            }

            SubjectAnalytics(
                subject = subject,
                completedChapters = completedCount,
                totalChapters = subjectChapters.size,
                avgAccuracyPercent = avgAccuracy,
                studyMinutesThisWeek = weeklyMinutes
            )
        }
    }

    fun detectWeakAndStrongChapters(
        progressList: List<ChapterProgressEntity>,
        selectedTrack: ExamTrack? = null
    ): Pair<List<ChapterStrength>, List<ChapterStrength>> {
        val progressMap = progressList.associateBy { it.chapterId }
        val scoped = if (selectedTrack != null) {
            JeeContentCatalog.chapters.filter { it.track == selectedTrack }.ifEmpty { JeeContentCatalog.chapters }
        } else {
            JeeContentCatalog.chapters
        }
        val evaluated = scoped.map { chapter ->
            val prog = progressMap[chapter.id]
            val accuracy = if (prog != null && prog.practiceAttempted > 0) {
                prog.practiceCorrect * 100f / prog.practiceAttempted
            } else if (prog?.isCompleted == true) {
                80f
            } else {
                0f
            }
            val status = when {
                prog == null || (!prog.isCompleted && prog.practiceAttempted == 0) -> "Needs Attention"
                accuracy < 55f -> "Weak"
                accuracy >= 75f || (prog.isCompleted && prog.revisionCount >= 1) -> "Strong"
                else -> "Moderate"
            }
            ChapterStrength(
                chapterId = chapter.id,
                chapterTitle = chapter.title,
                subject = chapter.subject,
                statusLabel = status,
                scoreMetric = accuracy
            )
        }

        val weak = evaluated.filter { it.statusLabel == "Weak" || it.statusLabel == "Needs Attention" }
            .sortedBy { it.scoreMetric }
            .take(5)
        val strong = evaluated.filter { it.statusLabel == "Strong" }
            .sortedByDescending { it.scoreMetric }
            .take(5)
        return weak to strong
    }
}
