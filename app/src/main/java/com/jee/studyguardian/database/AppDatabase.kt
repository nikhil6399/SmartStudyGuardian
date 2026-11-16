package com.jee.studyguardian.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        ChapterProgressEntity::class,
        StudyNoteEntity::class,
        SavedQuestionEntity::class,
        ChatMessageEntity::class,
        MockTestResultEntity::class,
        StudyGoalEntity::class,
        TimetableSlotEntity::class,
        BlockedAppEntity::class,
        FocusSessionEntity::class,
        FilterLogEntity::class,
        DailyStudyStatEntity::class,
        StudyAlarmEntity::class
    ],
    version = 3,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun chapterProgressDao(): ChapterProgressDao
    abstract fun studyNoteDao(): StudyNoteDao
    abstract fun savedQuestionDao(): SavedQuestionDao
    abstract fun chatMessageDao(): ChatMessageDao
    abstract fun mockTestResultDao(): MockTestResultDao
    abstract fun studyGoalDao(): StudyGoalDao
    abstract fun timetableSlotDao(): TimetableSlotDao
    abstract fun blockedAppDao(): BlockedAppDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun filterLogDao(): FilterLogDao
    abstract fun dailyStudyStatDao(): DailyStudyStatDao
    abstract fun studyAlarmDao(): StudyAlarmDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "jee_study_guardian.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
