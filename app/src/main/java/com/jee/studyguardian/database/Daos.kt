package com.jee.studyguardian.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChapterProgressDao {
    @Query("SELECT * FROM chapter_progress")
    fun observeAll(): Flow<List<ChapterProgressEntity>>

    @Query("SELECT * FROM chapter_progress")
    suspend fun getAllOnce(): List<ChapterProgressEntity>

    @Query("SELECT * FROM chapter_progress WHERE chapterId = :chapterId LIMIT 1")
    suspend fun getById(chapterId: String): ChapterProgressEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: ChapterProgressEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<ChapterProgressEntity>)

    @Query("DELETE FROM chapter_progress")
    suspend fun clearAll()
}

@Dao
interface StudyNoteDao {
    @Query("SELECT * FROM study_notes ORDER BY updatedAtEpochMs DESC")
    fun observeAll(): Flow<List<StudyNoteEntity>>

    @Query("SELECT * FROM study_notes ORDER BY updatedAtEpochMs DESC")
    suspend fun getAllOnce(): List<StudyNoteEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(note: StudyNoteEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(notes: List<StudyNoteEntity>)

    @Query("DELETE FROM study_notes WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM study_notes")
    suspend fun clearAll()
}

@Dao
interface SavedQuestionDao {
    @Query("SELECT * FROM saved_questions ORDER BY savedAtEpochMs DESC")
    fun observeAll(): Flow<List<SavedQuestionEntity>>

    @Query("SELECT * FROM saved_questions ORDER BY savedAtEpochMs DESC")
    suspend fun getAllOnce(): List<SavedQuestionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(question: SavedQuestionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveAll(questions: List<SavedQuestionEntity>)

    @Query("DELETE FROM saved_questions WHERE questionId = :questionId")
    suspend fun delete(questionId: String)

    @Query("DELETE FROM saved_questions")
    suspend fun clearAll()
}

@Dao
interface ChatMessageDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestampEpochMs ASC")
    fun observeAll(): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM chat_messages ORDER BY timestampEpochMs ASC")
    suspend fun getAllOnce(): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: ChatMessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<ChatMessageEntity>)

    @Query("UPDATE chat_messages SET isSavedAnswer = :saved WHERE id = :id")
    suspend fun setSaved(id: Long, saved: Boolean)

    @Query("DELETE FROM chat_messages")
    suspend fun clearAll()
}

@Dao
interface MockTestResultDao {
    @Query("SELECT * FROM mock_test_results ORDER BY timestampEpochMs DESC")
    fun observeAll(): Flow<List<MockTestResultEntity>>

    @Query("SELECT * FROM mock_test_results ORDER BY timestampEpochMs DESC")
    suspend fun getAllOnce(): List<MockTestResultEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(result: MockTestResultEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(results: List<MockTestResultEntity>)

    @Query("DELETE FROM mock_test_results")
    suspend fun clearAll()
}

@Dao
interface StudyGoalDao {
    @Query("SELECT * FROM study_goals ORDER BY isCompleted ASC, id DESC")
    fun observeAll(): Flow<List<StudyGoalEntity>>

    @Query("SELECT * FROM study_goals")
    suspend fun getAllOnce(): List<StudyGoalEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(goal: StudyGoalEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(goals: List<StudyGoalEntity>)

    @Query("DELETE FROM study_goals WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM study_goals")
    suspend fun clearAll()
}

@Dao
interface TimetableSlotDao {
    @Query("SELECT * FROM timetable_slots ORDER BY dayOfWeek ASC, startTimeLabel ASC")
    fun observeAll(): Flow<List<TimetableSlotEntity>>

    @Query("SELECT * FROM timetable_slots")
    suspend fun getAllOnce(): List<TimetableSlotEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(slot: TimetableSlotEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(slots: List<TimetableSlotEntity>)

    @Query("DELETE FROM timetable_slots WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM timetable_slots")
    suspend fun clearAll()
}

@Dao
interface BlockedAppDao {
    @Query("SELECT * FROM blocked_apps ORDER BY appName ASC")
    fun observeAll(): Flow<List<BlockedAppEntity>>

    @Query("SELECT * FROM blocked_apps WHERE isEnabled = 1")
    suspend fun getEnabledOnce(): List<BlockedAppEntity>

    @Query("SELECT * FROM blocked_apps")
    suspend fun getAllOnce(): List<BlockedAppEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(app: BlockedAppEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(apps: List<BlockedAppEntity>)

    @Query("UPDATE blocked_apps SET blockCountToday = blockCountToday + 1 WHERE packageName = :packageName")
    suspend fun incrementBlockCount(packageName: String)

    @Query("DELETE FROM blocked_apps WHERE packageName = :packageName")
    suspend fun remove(packageName: String)

    @Query("DELETE FROM blocked_apps")
    suspend fun clearAll()
}

@Dao
interface FocusSessionDao {
    @Query("SELECT * FROM focus_sessions ORDER BY startedAtEpochMs DESC")
    fun observeAll(): Flow<List<FocusSessionEntity>>

    @Query("SELECT * FROM focus_sessions ORDER BY startedAtEpochMs DESC")
    suspend fun getAllOnce(): List<FocusSessionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: FocusSessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(sessions: List<FocusSessionEntity>)

    @Query("DELETE FROM focus_sessions")
    suspend fun clearAll()
}

@Dao
interface FilterLogDao {
    @Query("SELECT * FROM filter_logs ORDER BY timestampEpochMs DESC LIMIT 200")
    fun observeRecent(): Flow<List<FilterLogEntity>>

    @Query("SELECT * FROM filter_logs ORDER BY timestampEpochMs DESC")
    suspend fun getAllOnce(): List<FilterLogEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: FilterLogEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(logs: List<FilterLogEntity>)

    @Query("DELETE FROM filter_logs")
    suspend fun clearAll()
}

@Dao
interface DailyStudyStatDao {
    @Query("SELECT * FROM daily_study_stats ORDER BY dateIso DESC LIMIT 30")
    fun observeLast30Days(): Flow<List<DailyStudyStatEntity>>

    @Query("SELECT * FROM daily_study_stats ORDER BY dateIso DESC")
    suspend fun getAllOnce(): List<DailyStudyStatEntity>

    @Query("SELECT * FROM daily_study_stats WHERE dateIso = :dateIso LIMIT 1")
    suspend fun getByDate(dateIso: String): DailyStudyStatEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(stat: DailyStudyStatEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(stats: List<DailyStudyStatEntity>)

    @Query("DELETE FROM daily_study_stats")
    suspend fun clearAll()
}

@Dao
interface StudyAlarmDao {
    @Query("SELECT * FROM study_alarms ORDER BY hour ASC, minute ASC")
    fun observeAll(): Flow<List<StudyAlarmEntity>>

    @Query("SELECT * FROM study_alarms ORDER BY hour ASC, minute ASC")
    suspend fun getAllOnce(): List<StudyAlarmEntity>

    @Query("SELECT * FROM study_alarms WHERE isEnabled = 1")
    suspend fun getEnabledOnce(): List<StudyAlarmEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(alarm: StudyAlarmEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(alarms: List<StudyAlarmEntity>)

    @Query("DELETE FROM study_alarms WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM study_alarms")
    suspend fun clearAll()
}
