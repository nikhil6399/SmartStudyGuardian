package com.jee.studyguardian.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomTab(
    val route: String,
    val icon: ImageVector
) {
    data object Home : BottomTab("home", Icons.Default.Home)
    data object AiTutor : BottomTab("ai_tutor", Icons.Default.AutoAwesome)
    data object JeePractice : BottomTab("jee_practice", Icons.Default.MenuBook)
    data object Blocker : BottomTab("blocker", Icons.Default.Shield)
    data object Settings : BottomTab("settings", Icons.Default.Settings)

    companion object {
        val allTabs = listOf(Home, AiTutor, JeePractice, Blocker, Settings)
    }
}

object SubRoutes {
    const val MOCK_TEST = "mock_test"
    const val STUDY_PLANNER = "study_planner"
    const val ANALYTICS = "analytics"
}
