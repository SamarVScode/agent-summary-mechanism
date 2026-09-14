package com.agentflow.tracker.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.model.GroupedDailySubmission
import com.agentflow.tracker.data.model.ScreenshotItem
import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val selectedMonth: String = DateUtils.getCurrentMonthYear(),
    val selectedCycle: String = "all", // "all", "c1", "c2"
    val availableMonths: List<String> = listOf(DateUtils.getCurrentMonthYear()),
    val groupedSubmissions: List<GroupedDailySubmission> = emptyList(),
    val filteredSubmissions: List<GroupedDailySubmission> = emptyList(),
    val cycleCounts: Map<String, Int> = mapOf("all" to 0, "c1" to 0, "c2" to 0),
    val activeDetailSubmission: GroupedDailySubmission? = null,
    val fullScreenImageUrl: String? = null
)

class DashboardViewModel(
    private val supabaseService: SupabaseService,
    private val agentName: String,
    val rateAmount: Double
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var rawSubmissions: List<Submission> = emptyList()

    init {
        loadSubmissions()
    }

    fun loadSubmissions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = supabaseService.fetchSubmissions(agentName)

            result.onSuccess { subs ->
                rawSubmissions = subs
                processSubmissions()
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: "Failed to load history"
                )
            }
        }
    }

    private fun processSubmissions() {
        // 1. Group by date
        val groupedMap = mutableMapOf<String, MutableList<Submission>>()
        val monthsSet = mutableSetOf<String>()
        monthsSet.add(DateUtils.getCurrentMonthYear())

        for (sub in rawSubmissions) {
            val date = sub.date
            val list = groupedMap.getOrPut(date) { mutableListOf() }
            list.add(sub)

            val monthStr = DateUtils.getMonthYearStr(date)
            if (monthStr != "Unknown") {
                monthsSet.add(monthStr)
            }
        }

        val groupedList = groupedMap.map { (date, subs) ->
            val total = subs.sumOf { it.totalCount }
            val completed = subs.sumOf { it.completedCount }
            val screenshots = subs.filter { it.imageUrl.isNotBlank() }.map {
                ScreenshotItem(
                    url = it.imageUrl,
                    createdAt = it.createdAt,
                    totalCount = it.totalCount,
                    completedCount = it.completedCount
                )
            }
            GroupedDailySubmission(
                date = date,
                totalCount = total,
                completedCount = completed,
                screenshots = screenshots
            )
        }.sortedByDescending { DateUtils.parseDate(it.date)?.time ?: 0 }

        val currentMonth = _uiState.value.selectedMonth
        val availableMonths = monthsSet.toList()

        // Calculate cycle counts for the selected month
        val monthSubs = groupedList.filter { DateUtils.getMonthYearStr(it.date) == currentMonth }
        var c1 = 0
        var c2 = 0
        for (sub in monthSubs) {
            if (DateUtils.dateMatchesCycle(sub.date, "c1")) c1++
            if (DateUtils.dateMatchesCycle(sub.date, "c2")) c2++
        }
        val cycleCounts = mapOf("all" to monthSubs.size, "c1" to c1, "c2" to c2)

        // Filter by month & cycle
        val cycle = _uiState.value.selectedCycle
        val filtered = groupedList.filter { sub ->
            val matchMonth = DateUtils.getMonthYearStr(sub.date) == currentMonth
            val matchCycle = DateUtils.dateMatchesCycle(sub.date, cycle)
            matchMonth && matchCycle
        }

        _uiState.value = _uiState.value.copy(
            isLoading = false,
            availableMonths = availableMonths,
            groupedSubmissions = groupedList,
            filteredSubmissions = filtered,
            cycleCounts = cycleCounts
        )
    }

    fun selectMonth(month: String) {
        _uiState.value = _uiState.value.copy(selectedMonth = month)
        processSubmissions()
    }

    fun selectCycle(cycle: String) {
        _uiState.value = _uiState.value.copy(selectedCycle = cycle)
        processSubmissions()
    }

    fun openDetail(submission: GroupedDailySubmission) {
        _uiState.value = _uiState.value.copy(activeDetailSubmission = submission)
    }

    fun closeDetail() {
        _uiState.value = _uiState.value.copy(activeDetailSubmission = null)
    }

    fun showFullScreenImage(url: String) {
        _uiState.value = _uiState.value.copy(fullScreenImageUrl = url)
    }

    fun hideFullScreenImage() {
        _uiState.value = _uiState.value.copy(fullScreenImageUrl = null)
    }
}
