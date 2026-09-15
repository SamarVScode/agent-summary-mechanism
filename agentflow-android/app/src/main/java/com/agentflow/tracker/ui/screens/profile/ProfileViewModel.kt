package com.agentflow.tracker.ui.screens.profile

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.LocalSubmission
import com.agentflow.tracker.data.local.LocalSubmissionsDbHelper
import com.agentflow.tracker.data.local.UserPreferences
import com.agentflow.tracker.data.model.CycleStats
import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ProfileUiState(
    val isLoading: Boolean = false,
    val selectedMonth: String = DateUtils.getCurrentMonthYear(),
    val selectedCycle: String = DateUtils.getCurrentCycle(), // "c1", "c2", "all"
    val availableMonths: List<String> = listOf(DateUtils.getCurrentMonthYear()),
    val cycleStats: CycleStats = CycleStats(0.0, 0, 0.0, 0, 0.0, 0),
    val allTimeCompleted: Int = 0,
    val allTimeEarnings: Double = 0.0,
    val currentTheme: String = "system"
)

class ProfileViewModel(
    private val context: Context,
    private val supabaseService: SupabaseService,
    private val userPreferences: UserPreferences,
    val agentName: String,
    val casperId: String,
    val rateAmount: Double
) : ViewModel() {

    private val dbHelper = LocalSubmissionsDbHelper.getInstance(context)

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private var submissions: List<Submission> = emptyList()

    init {
        // 1. Immediately load local submissions (offline-first, zero delay)
        loadFromLocal()

        // 2. React to any local database changes (work logged in Tracker or synced via WorkManager)
        viewModelScope.launch {
            dbHelper.dbUpdateTrigger.collect {
                loadFromLocal()
            }
        }

        // 3. Silently refresh from Supabase if online
        if (NetworkUtils.isOnline(context)) {
            refreshRemote()
        }

        observeTheme()
    }

    private fun observeTheme() {
        viewModelScope.launch {
            userPreferences.themeFlow.collect { theme ->
                _uiState.value = _uiState.value.copy(currentTheme = theme)
            }
        }
    }

    private fun loadFromLocal() {
        viewModelScope.launch(Dispatchers.IO) {
            val localSubs = dbHelper.getAllSubmissions(casperId)
            val mapped = localSubs.map {
                Submission(
                    id = it.id,
                    date = it.date,
                    agentName = it.agentName,
                    casperId = it.casperId,
                    totalCount = it.totalCount,
                    completedCount = it.completedCount,
                    imageUrl = it.imageUrl,
                    fileHash = it.fileHash
                )
            }
            withContext(Dispatchers.Main) {
                submissions = mapped
                recalculate()
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun loadData() {
        loadFromLocal()
        if (NetworkUtils.isOnline(context)) {
            refreshRemote()
        }
    }

    private fun refreshRemote() {
        viewModelScope.launch {
            val res = supabaseService.fetchSubmissions(agentName)
            res.onSuccess { subs ->
                dbHelper.syncFromRemote(subs, casperId)
                loadFromLocal()
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
