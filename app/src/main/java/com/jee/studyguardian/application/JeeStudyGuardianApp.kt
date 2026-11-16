package com.jee.studyguardian.application

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.jee.studyguardian.ai.AiProviderClient
import com.jee.studyguardian.data.PreferencesManager
import com.jee.studyguardian.database.AppDatabase
import com.jee.studyguardian.planner.StudyReminderWorker
import com.jee.studyguardian.repository.AiTutorRepository
import com.jee.studyguardian.repository.BackupRepository
import com.jee.studyguardian.repository.BlockerRepository
import com.jee.studyguardian.repository.MockTestRepository
import com.jee.studyguardian.repository.PlannerRepository
import com.jee.studyguardian.repository.StudyRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class AppContainer(application: Application) {
    val database: AppDatabase by lazy { AppDatabase.getInstance(application) }
    val preferencesManager: PreferencesManager by lazy { PreferencesManager(application) }
    val aiProviderClient: AiProviderClient by lazy { AiProviderClient() }

    val studyRepository: StudyRepository by lazy { StudyRepository(database) }
    val mockTestRepository: MockTestRepository by lazy { MockTestRepository(database) }
    val aiTutorRepository: AiTutorRepository by lazy { AiTutorRepository(database, aiProviderClient) }
    val plannerRepository: PlannerRepository by lazy { PlannerRepository(database) }
    val blockerRepository: BlockerRepository by lazy { BlockerRepository(database) }
    val backupRepository: BackupRepository by lazy { BackupRepository(database, preferencesManager) }
}

class JeeStudyGuardianApp : Application() {

    lateinit var container: AppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        createNotificationChannels()
        StudyReminderWorker.schedule(this)
        appScope.launch {
            container.plannerRepository.seedDefaultTimetableIfEmpty()
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)
            val focusChannel = NotificationChannel(
                CHANNEL_FOCUS_SERVICE,
                "Study Focus Shield",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows remaining focus session time when distraction blocking is active."
            }
            val reminderChannel = NotificationChannel(
                CHANNEL_REMINDERS,
                "Revision & Break Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily JEE revision alerts and Pomodoro break notifications."
            }
            nm.createNotificationChannel(focusChannel)
            nm.createNotificationChannel(reminderChannel)
        }
    }

    companion object {
        const val CHANNEL_FOCUS_SERVICE = "focus_shield_channel"
        const val CHANNEL_REMINDERS = "study_reminders_channel"
    }
}
