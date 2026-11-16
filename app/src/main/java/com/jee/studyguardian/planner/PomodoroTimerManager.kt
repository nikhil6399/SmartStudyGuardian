package com.jee.studyguardian.planner

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class PomodoroPhase { STUDY, BREAK }

data class PomodoroUiState(
    val isRunning: Boolean = false,
    val phase: PomodoroPhase = PomodoroPhase.STUDY,
    val remainingSeconds: Int = 50 * 60,
    val studyDurationMinutes: Int = 50,
    val breakDurationMinutes: Int = 10,
    val completedPomodorosToday: Int = 0
)

class PomodoroTimerManager(
    private val scope: CoroutineScope,
    private val onStudyCycleCompleted: (minutesCompleted: Int) -> Unit,
    private val onBreakReminder: (phase: PomodoroPhase) -> Unit
) {
    private val _state = MutableStateFlow(PomodoroUiState())
    val state: StateFlow<PomodoroUiState> = _state.asStateFlow()

    private var tickerJob: Job? = null

    fun configureDurations(studyMin: Int, breakMin: Int) {
        val current = _state.value
        if (!current.isRunning) {
            _state.value = current.copy(
                studyDurationMinutes = studyMin,
                breakDurationMinutes = breakMin,
                remainingSeconds = if (current.phase == PomodoroPhase.STUDY) studyMin * 60 else breakMin * 60
            )
        }
    }

    fun startOrResume() {
        if (_state.value.isRunning) return
        _state.value = _state.value.copy(isRunning = true)
        tickerJob?.cancel()
        tickerJob = scope.launch(Dispatchers.Default) {
            while (_state.value.isRunning) {
                delay(1000L)
                val current = _state.value
                if (current.remainingSeconds > 1) {
                    _state.value = current.copy(remainingSeconds = current.remainingSeconds - 1)
                } else {
                    if (current.phase == PomodoroPhase.STUDY) {
                        onStudyCycleCompleted(current.studyDurationMinutes)
                        onBreakReminder(PomodoroPhase.BREAK)
                        _state.value = current.copy(
                            phase = PomodoroPhase.BREAK,
                            remainingSeconds = current.breakDurationMinutes * 60,
                            completedPomodorosToday = current.completedPomodorosToday + 1
                        )
                    } else {
                        onBreakReminder(PomodoroPhase.STUDY)
                        _state.value = current.copy(
                            phase = PomodoroPhase.STUDY,
                            remainingSeconds = current.studyDurationMinutes * 60
                        )
                    }
                }
            }
        }
    }

    fun pause() {
        tickerJob?.cancel()
        _state.value = _state.value.copy(isRunning = false)
    }

    fun reset() {
        tickerJob?.cancel()
        val current = _state.value
        _state.value = current.copy(
            isRunning = false,
            phase = PomodoroPhase.STUDY,
            remainingSeconds = current.studyDurationMinutes * 60
        )
    }
}
