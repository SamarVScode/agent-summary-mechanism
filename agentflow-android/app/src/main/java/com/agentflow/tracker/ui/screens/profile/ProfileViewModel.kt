package com.agentflow.tracker.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences
import com.agentflow.tracker.data.model.CycleStats
import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val selectedMonth: String = DateUtils.getCurrentMonthYear(),
    val selectedCycle: String = DateUtils.getCurrentCycle(), // "c1", "c2", "all"
    val availableMonths: List<String> = listOf(DateUtils.getCurrentMonthYear()),
    val cycleStats: CycleStats = CycleStats(0.0, 0, 0.0, 0, 0.0, 0),
    val allTimeCompleted: Int = 0,
    val allTimeEarnings: Double = 0.0,
    val currentTheme: String = "system"
)

class ProfileViewModel(
    private val supabaseService: SupabaseService,
    private val userPreferences: UserPreferences,
    val agentName: String,
    val casperId: String,
    val rateAmount: Double
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private var submissions: List<Submission> = emptyList()

    init {
        loadData()
        observeTheme()
    }

    private fun observeTheme() {
        viewModelScope.launch {
            userPreferences.themeFlow.collect { theme ->
                _uiState.value = _uiState.value.copy(currentTheme = theme)
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            val res = supabaseService.fetchSubmissions(agentName)
            res.onSuccess { subs ->
                submissions = subs
                recalculate()
            }
        }
    }

    private fun recalculate() {
        val monthsSet = mutableSetOf<String>()
        monthsSet.add(DateUtils.getCurrentMonthYear())
        var allTimeComp = 0

        for (sub in submissions) {
            allTimeComp += sub.completedCount
            val m = DateUtils.getMonthYearStr(sub.date)
            if (m != "Unknown") monthsSet.add(m)
        }

        val month = _uiState.value.selectedMonth
        val stats = DateUtils.calculateCycleStats(submissions, month, rateAmount)

        _uiState.value = _uiState.value.copy(
            availableMonths = monthsSet.toList(),
            cycleStats = stats,
            allTimeCompleted = allTimeComp,
            allTimeEarnings = allTimeComp * rateAmount
        )
    }

    fun selectMonth(month: String) {
        _uiState.value = _uiState.value.copy(selectedMonth = month)
        recalculate()
    }

    fun selectCycle(cycle: String) {
        _uiState.value = _uiState.value.copy(selectedCycle = cycle)
    }

    fun setTheme(theme: String) {
        viewModelScope.launch {
            userPreferences.setTheme(theme)
        }
    }

    fun toggleTheme() {
        val next = if (_uiState.value.currentTheme == "dark") "light" else "dark"
        setTheme(next)
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            userPreferences.clearAgentInfo()
            onLoggedOut()
        }
    }
}
