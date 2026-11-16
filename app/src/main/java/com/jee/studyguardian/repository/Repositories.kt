package com.jee.studyguardian.repository

import com.jee.studyguardian.ai.AiProviderClient
import com.jee.studyguardian.ai.AiTutorResponse
import com.jee.studyguardian.data.JeeContentCatalog
import com.jee.studyguardian.data.PreferencesManager
import com.jee.studyguardian.database.AppDatabase
import com.jee.studyguardian.database.BlockedAppEntity
import com.jee.studyguardian.database.ChapterProgressEntity
import com.jee.studyguardian.database.ChatMessageEntity
import com.jee.studyguardian.database.DailyStudyStatEntity
import com.jee.studyguardian.database.FilterLogEntity
import com.jee.studyguardian.database.FocusSessionEntity
import com.jee.studyguardian.database.MockTestResultEntity
import com.jee.studyguardian.database.SavedQuestionEntity
import com.jee.studyguardian.database.StudyAlarmEntity
import com.jee.studyguardian.database.StudyGoalEntity
import com.jee.studyguardian.database.StudyNoteEntity
import com.jee.studyguardian.database.TimetableSlotEntity
import com.jee.studyguardian.models.LanguageMode
import com.jee.studyguardian.models.PracticeQuestion
import com.jee.studyguardian.models.Subject
import com.jee.studyguardian.utils.TimeFormatters
import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONObject

class StudyRepository(private val db: AppDatabase) {
    fun observeChapterProgress(): Flow<List<ChapterProgressEntity>> = db.chapterProgressDao().observeAll()
    fun observeNotes(): Flow<List<StudyNoteEntity>> = db.studyNoteDao().observeAll()
    fun observeSavedQuestions(): Flow<List<SavedQuestionEntity>> = db.savedQuestionDao().observeAll()
    fun observeDailyStats(): Flow<List<DailyStudyStatEntity>> = db.dailyStudyStatDao().observeLast30Days()

    suspend fun toggleChapterCompleted(chapterId: String) {
        val existing = db.chapterProgressDao().getById(chapterId)
        val now = System.currentTimeMillis()
        val updated = if (existing == null) {
            ChapterProgressEntity(chapterId = chapterId, isCompleted = true, revisionCount = 1, lastRevisedEpochMs = now)
        } else {
            existing.copy(isCompleted = !existing.isCompleted, lastRevisedEpochMs = now)
        }
        db.chapterProgressDao().upsert(updated)
    }

    suspend fun recordChapterRevision(chapterId: String) {
        val existing = db.chapterProgressDao().getById(chapterId)
        val now = System.currentTimeMillis()
        val nextRev = now + 3L * 24 * 60 * 60 * 1000
        val updated = (existing ?: ChapterProgressEntity(chapterId = chapterId)).copy(
            revisionCount = (existing?.revisionCount ?: 0) + 1,
            lastRevisedEpochMs = now,
            nextRevisionEpochMs = nextRev
        )
        db.chapterProgressDao().upsert(updated)
    }

    suspend fun recordPracticeAttempt(chapterId: String, isCorrect: Boolean) {
        val existing = db.chapterProgressDao().getById(chapterId)
        val updated = (existing ?: ChapterProgressEntity(chapterId = chapterId)).copy(
            practiceAttempted = (existing?.practiceAttempted ?: 0) + 1,
            practiceCorrect = (existing?.practiceCorrect ?: 0) + if (isCorrect) 1 else 0
        )
        db.chapterProgressDao().upsert(updated)
    }

    suspend fun saveNote(chapterId: String, subject: Subject, title: String, content: String) {
        db.studyNoteDao().insert(
            StudyNoteEntity(
                chapterId = chapterId,
                subject = subject.name,
                title = title,
                content = content
            )
        )
    }

    suspend fun deleteNote(id: Long) = db.studyNoteDao().deleteById(id)

    suspend fun toggleSaveQuestion(question: PracticeQuestion, currentlySaved: Boolean) {
        if (currentlySaved) {
            db.savedQuestionDao().delete(question.id)
        } else {
            db.savedQuestionDao().save(
                SavedQuestionEntity(
                    questionId = question.id,
                    subject = question.subject.name,
                    chapterId = question.chapterId,
                    prompt = question.prompt,
                    explanation = question.explanation
                )
            )
        }
    }

    suspend fun addStudyMinutesToday(subject: Subject, minutes: Int) {
        val today = TimeFormatters.todayIso()
        val existing = db.dailyStudyStatDao().getByDate(today) ?: DailyStudyStatEntity(dateIso = today)
        val updated = when (subject) {
            Subject.PHYSICS -> existing.copy(physicsMinutes = existing.physicsMinutes + minutes)
            Subject.CHEMISTRY -> existing.copy(chemistryMinutes = existing.chemistryMinutes + minutes)
            Subject.MATHEMATICS -> existing.copy(mathMinutes = existing.mathMinutes + minutes)
        }
        db.dailyStudyStatDao().upsert(updated)
    }
}

class MockTestRepository(private val db: AppDatabase) {
    fun observeHistory(): Flow<List<MockTestResultEntity>> = db.mockTestResultDao().observeAll()

    suspend fun saveResult(result: MockTestResultEntity) {
        db.mockTestResultDao().insert(result)
        val today = TimeFormatters.todayIso()
        val existing = db.dailyStudyStatDao().getByDate(today) ?: DailyStudyStatEntity(dateIso = today)
        db.dailyStudyStatDao().upsert(
            existing.copy(questionsSolved = existing.questionsSolved + result.attempted)
        )
    }
}

class AiTutorRepository(
    private val db: AppDatabase,
    private val aiClient: AiProviderClient
) {
    fun observeChatHistory(): Flow<List<ChatMessageEntity>> = db.chatMessageDao().observeAll()

    suspend fun sendQuestion(
        backendUrl: String,
        question: String,
        subject: Subject,
        language: LanguageMode,
        mode: String,
        level: com.jee.studyguardian.models.StudyLevel
    ): AiTutorResponse {
        db.chatMessageDao().insert(
            ChatMessageEntity(
                role = "user",
                subjectTag = subject.name,
                languageCode = language.code,
                content = question
            )
        )
        val result = aiClient.askStudyQuestion(
            backendUrl = backendUrl,
            question = question,
            subject = subject,
            language = language,
            mode = mode,
            level = level
        )
        if (result is AiTutorResponse.Success) {
            db.chatMessageDao().insert(
                ChatMessageEntity(
                    role = "assistant",
                    subjectTag = subject.name,
                    languageCode = language.code,
                    content = result.answerText,
                    structuredJson = result.structuredJson
                )
            )
        }
        return result
    }

    suspend fun toggleSaveAnswer(id: Long, saved: Boolean) = db.chatMessageDao().setSaved(id, saved)
    suspend fun clearHistory() = db.chatMessageDao().clearAll()
}

class PlannerRepository(private val db: AppDatabase) {
    fun observeGoals(): Flow<List<StudyGoalEntity>> = db.studyGoalDao().observeAll()
    fun observeTimetable(): Flow<List<TimetableSlotEntity>> = db.timetableSlotDao().observeAll()
    fun observeAlarms(): Flow<List<StudyAlarmEntity>> = db.studyAlarmDao().observeAll()

    suspend fun seedDefaultTimetableIfEmpty() {
        if (db.timetableSlotDao().getAllOnce().isEmpty()) {
            val defaults = listOf(
                TimetableSlotEntity(dayOfWeek = 1, startTimeLabel = "06:30", endTimeLabel = "08:30", subject = Subject.PHYSICS.name, chapterTitle = "Rotational Dynamics"),
                TimetableSlotEntity(dayOfWeek = 1, startTimeLabel = "17:00", endTimeLabel = "19:00", subject = Subject.CHEMISTRY.name, chapterTitle = "General Organic Chemistry"),
                TimetableSlotEntity(dayOfWeek = 2, startTimeLabel = "06:30", endTimeLabel = "08:30", subject = Subject.MATHEMATICS.name, chapterTitle = "Definite Integration"),
                TimetableSlotEntity(dayOfWeek = 3, startTimeLabel = "18:00", endTimeLabel = "20:00", subject = Subject.PHYSICS.name, chapterTitle = "Electrostatics Revision", isRevisionSlot = true)
            )
            db.timetableSlotDao().upsertAll(defaults)
        }
        if (db.studyGoalDao().getAllOnce().isEmpty()) {
            val today = TimeFormatters.todayIso()
            db.studyGoalDao().upsertAll(
                listOf(
                    StudyGoalEntity(title = "Solve 30 Electrostatics Numericals", subject = Subject.PHYSICS.name, targetMinutes = 90, dueDateIso = today),
                    StudyGoalEntity(title = "Revise GOC Stability & Resonance", subject = Subject.CHEMISTRY.name, targetMinutes = 60, dueDateIso = today),
                    StudyGoalEntity(title = "Complete 25 Definite Integral Problems", subject = Subject.MATHEMATICS.name, targetMinutes = 90, dueDateIso = today)
                )
            )
        }
        if (db.studyAlarmDao().getAllOnce().isEmpty()) {
            db.studyAlarmDao().upsert(
                StudyAlarmEntity(
                    hour = 6,
                    minute = 30,
                    label = "Morning Formula & NCERT Revision",
                    daysCsv = "1,2,3,4,5,6",
                    isEnabled = false,
                    subject = Subject.PHYSICS.name
                )
            )
        }
    }

    suspend fun addGoal(title: String, subject: Subject, targetMinutes: Int) {
        db.studyGoalDao().upsert(
            StudyGoalEntity(
                title = title,
                subject = subject.name,
                targetMinutes = targetMinutes,
                dueDateIso = TimeFormatters.todayIso()
            )
        )
    }

    suspend fun toggleGoalCompleted(goal: StudyGoalEntity) {
        val nextDone = !goal.isCompleted
        db.studyGoalDao().upsert(
            goal.copy(
                isCompleted = nextDone,
                completedMinutes = if (nextDone) goal.targetMinutes else 0
            )
        )
    }

    suspend fun deleteGoal(id: Long) = db.studyGoalDao().deleteById(id)

    suspend fun addTimetableSlot(
        dayOfWeek: Int,
        startTime: String,
        endTime: String,
        subject: Subject,
        chapterTitle: String,
        isRevision: Boolean
    ) {
        db.timetableSlotDao().upsert(
            TimetableSlotEntity(
                dayOfWeek = dayOfWeek,
                startTimeLabel = startTime,
                endTimeLabel = endTime,
                subject = subject.name,
                chapterTitle = chapterTitle,
                isRevisionSlot = isRevision
            )
        )
    }

    suspend fun deleteTimetableSlot(id: Long) = db.timetableSlotDao().deleteById(id)

    suspend fun addAlarm(hour: Int, minute: Int, label: String, daysCsv: String, subject: Subject): StudyAlarmEntity {
        val entity = StudyAlarmEntity(
            hour = hour.coerceIn(0, 23),
            minute = minute.coerceIn(0, 59),
            label = label,
            daysCsv = daysCsv,
            isEnabled = true,
            subject = subject.name
        )
        val newId = db.studyAlarmDao().upsert(entity)
        return entity.copy(id = newId)
    }

    suspend fun toggleAlarm(alarm: StudyAlarmEntity): StudyAlarmEntity {
        val updated = alarm.copy(isEnabled = !alarm.isEnabled)
        db.studyAlarmDao().upsert(updated)
        return updated
    }

    suspend fun deleteAlarm(id: Long) = db.studyAlarmDao().deleteById(id)
}

class BlockerRepository(private val db: AppDatabase) {
    fun observeBlockedApps(): Flow<List<BlockedAppEntity>> = db.blockedAppDao().observeAll()
    fun observeFocusSessions(): Flow<List<FocusSessionEntity>> = db.focusSessionDao().observeAll()
    fun observeFilterLogs(): Flow<List<FilterLogEntity>> = db.filterLogDao().observeRecent()

    suspend fun toggleBlockedApp(packageName: String, appName: String, currentlyBlocked: Boolean) {
        if (currentlyBlocked) {
            db.blockedAppDao().remove(packageName)
        } else {
            db.blockedAppDao().upsert(BlockedAppEntity(packageName = packageName, appName = appName, isEnabled = true))
        }
    }

    suspend fun updateAppSchedule(packageName: String, startHour: Int, endHour: Int) {
        val existing = db.blockedAppDao().getAllOnce().firstOrNull { it.packageName == packageName } ?: return
        db.blockedAppDao().upsert(existing.copy(scheduleStartHour = startHour, scheduleEndHour = endHour))
    }

    suspend fun logFocusSession(session: FocusSessionEntity) {
        db.focusSessionDao().insert(session)
        if (session.status == "COMPLETED") {
            val today = TimeFormatters.todayIso()
            val existing = db.dailyStudyStatDao().getByDate(today) ?: DailyStudyStatEntity(dateIso = today)
            db.dailyStudyStatDao().upsert(
                existing.copy(
                    focusSessionsCompleted = existing.focusSessionsCompleted + 1,
                    physicsMinutes = existing.physicsMinutes + session.actualMinutes
                )
            )
        }
    }

    suspend fun logFilterEvent(source: String, summary: String, rule: String, action: String) {
        db.filterLogDao().insert(
            FilterLogEntity(
                source = source,
                summary = summary,
                matchedRule = rule,
                actionTaken = action
            )
        )
    }
}

class BackupRepository(
    private val db: AppDatabase,
    private val prefs: PreferencesManager
) {
    suspend fun exportLocalBackupJson(): String {
        val root = JSONObject()
        root.put("version", 1)
        root.put("exportedAt", System.currentTimeMillis())

        val progressArr = JSONArray()
        db.chapterProgressDao().getAllOnce().forEach {
            progressArr.put(JSONObject().apply {
                put("chapterId", it.chapterId)
                put("isCompleted", it.isCompleted)
                put("revisionCount", it.revisionCount)
                put("lastRevisedEpochMs", it.lastRevisedEpochMs)
                put("practiceCorrect", it.practiceCorrect)
                put("practiceAttempted", it.practiceAttempted)
            })
        }
        root.put("chapterProgress", progressArr)

        val notesArr = JSONArray()
        db.studyNoteDao().getAllOnce().forEach {
            notesArr.put(JSONObject().apply {
                put("chapterId", it.chapterId)
                put("subject", it.subject)
                put("title", it.title)
                put("content", it.content)
                put("updatedAtEpochMs", it.updatedAtEpochMs)
            })
        }
        root.put("notes", notesArr)

        val goalsArr = JSONArray()
        db.studyGoalDao().getAllOnce().forEach {
            goalsArr.put(JSONObject().apply {
                put("title", it.title)
                put("subject", it.subject)
                put("targetMinutes", it.targetMinutes)
                put("completedMinutes", it.completedMinutes)
                put("isCompleted", it.isCompleted)
                put("dueDateIso", it.dueDateIso)
            })
        }
        root.put("goals", goalsArr)

        return root.toString(2)
    }

    suspend fun restoreFromBackupJson(jsonString: String): Result<Int> = runCatching {
        val root = JSONObject(jsonString)
        var restoredItems = 0

        val progressArr = root.optJSONArray("chapterProgress")
        if (progressArr != null) {
            val list = mutableListOf<ChapterProgressEntity>()
            for (i in 0 until progressArr.length()) {
                val obj = progressArr.getJSONObject(i)
                list.add(
                    ChapterProgressEntity(
                        chapterId = obj.getString("chapterId"),
                        isCompleted = obj.optBoolean("isCompleted"),
                        revisionCount = obj.optInt("revisionCount"),
                        lastRevisedEpochMs = obj.optLong("lastRevisedEpochMs"),
                        practiceCorrect = obj.optInt("practiceCorrect"),
                        practiceAttempted = obj.optInt("practiceAttempted")
                    )
                )
            }
            db.chapterProgressDao().upsertAll(list)
            restoredItems += list.size
        }

        val notesArr = root.optJSONArray("notes")
        if (notesArr != null) {
            val list = mutableListOf<StudyNoteEntity>()
            for (i in 0 until notesArr.length()) {
                val obj = notesArr.getJSONObject(i)
                list.add(
                    StudyNoteEntity(
                        chapterId = obj.optString("chapterId", JeeContentCatalog.chapters.first().id),
                        subject = obj.optString("subject", Subject.PHYSICS.name),
                        title = obj.getString("title"),
                        content = obj.getString("content"),
                        updatedAtEpochMs = obj.optLong("updatedAtEpochMs", System.currentTimeMillis())
                    )
                )
            }
            db.studyNoteDao().insertAll(list)
            restoredItems += list.size
        }

        val goalsArr = root.optJSONArray("goals")
        if (goalsArr != null) {
            val list = mutableListOf<StudyGoalEntity>()
            for (i in 0 until goalsArr.length()) {
                val obj = goalsArr.getJSONObject(i)
                list.add(
                    StudyGoalEntity(
                        title = obj.getString("title"),
                        subject = obj.optString("subject", Subject.PHYSICS.name),
                        targetMinutes = obj.optInt("targetMinutes", 60),
                        completedMinutes = obj.optInt("completedMinutes", 0),
                        isCompleted = obj.optBoolean("isCompleted", false),
                        dueDateIso = obj.optString("dueDateIso", TimeFormatters.todayIso())
                    )
                )
            }
            db.studyGoalDao().upsertAll(list)
            restoredItems += list.size
        }

        restoredItems
    }

    suspend fun clearAllLocalData() {
        db.chapterProgressDao().clearAll()
        db.studyNoteDao().clearAll()
        db.savedQuestionDao().clearAll()
        db.chatMessageDao().clearAll()
        db.mockTestResultDao().clearAll()
        db.studyGoalDao().clearAll()
        db.timetableSlotDao().clearAll()
        db.blockedAppDao().clearAll()
        db.focusSessionDao().clearAll()
        db.filterLogDao().clearAll()
        db.dailyStudyStatDao().clearAll()
        db.studyAlarmDao().clearAll()
        prefs.clearAll()
    }
}
