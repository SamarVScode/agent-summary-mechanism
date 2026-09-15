package com.agentflow.tracker.ui.screens.dashboard

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.LocalSubmission
import com.agentflow.tracker.data.local.LocalSubmissionsDbHelper
import com.agentflow.tracker.data.model.GroupedDailySubmission
import com.agentflow.tracker.data.model.ScreenshotItem
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.sync.SyncSubmissionsWorker
import com.agentflow.tracker.domain.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val errorMessage: String? = null,
    val offlineToastMessage: String? = null,
    val pendingSyncCount: Int = 0,
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
    private val context: Context,
    private val supabaseService: SupabaseService,
    private val agentName: String,
    private val casperId: String,
    val rateAmount: Double
) : ViewModel() {

    private val dbHelper = LocalSubmissionsDbHelper.getInstance(context)

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var rawSubmissions: List<LocalSubmission> = emptyList()

    init {
        // 1. Instantly load from local database (offline-first, zero delay)
        loadFromLocalDatabase()

        // 2. React to any local database changes (inserts, sync updates from WorkManager)
        viewModelScope.launch {
            dbHelper.dbUpdateTrigger.collect {
                loadFromLocalDatabase()
            }
        }

        // 3. If online, sync pending items and fetch latest from Supabase
        if (NetworkUtils.isOnline(context)) {
            refreshRemote()
        }
    }

    private fun loadFromLocalDatabase() {
        viewModelScope.launch(Dispatchers.IO) {
            val localSubs = dbHelper.getAllSubmissions(casperId)
            rawSubmissions = localSubs
            processSubmissions()
        }
    }

    fun refreshSubmissions() {
        if (!NetworkUtils.isOnline(context)) {
            _uiState.value = _uiState.value.copy(
                isRefreshing = false,
                offlineToastMessage = "No internet connection"
            )
            return
        }

        refreshRemote(showSpinner = true)
    }

    private fun refreshRemote(showSpinner: Boolean = false) {
        viewModelScope.launch {
            if (showSpinner) {
                _uiState.value = _uiState.value.copy(isRefreshing = true, errorMessage = null)
            }

            // Trigger sync for any pending items
            SyncSubmissionsWorker.enqueue(context)

            val result = supabaseService.fetchSubmissions(agentName)
            result.onSuccess { remoteSubs ->
                // Sync remote into local DB (won't overwrite pending items)
                dbHelper.syncFromRemote(remoteSubs, casperId)
                if (showSpinner) {
                    _uiState.value = _uiState.value.copy(isRefreshing = false)
                }
            }.onFailure { error ->
                if (showSpinner) {
                    _uiState.value = _uiState.value.copy(
                        isRefreshing = false,
                        errorMessage = if (NetworkUtils.isOnline(context)) (error.message ?: "Failed to refresh history") else null
                    )
                }
            }
        }
    }

    fun clearOfflineToast() {
        _uiState.value = _uiState.value.copy(offlineToastMessage = null)
    }

    private fun processSubmissions() {
        viewModelScope.launch(Dispatchers.Default) {
            val subs = rawSubmissions
            val currentMonth = _uiState.value.selectedMonth
            val currentCycle = _uiState.value.selectedCycle

            var pendingCount = 0

            // 1. Group by date
            val groupedMap = mutableMapOf<String, MutableList<LocalSubmission>>()
            val monthsSet = mutableSetOf<String>()
            monthsSet.add(DateUtils.getCurrentMonthYear())

            for (sub in subs) {
                if (sub.syncStatus == "PENDING") {
                    pendingCount++
                }

                val date = sub.date
                val list = groupedMap.getOrPut(date) { mutableListOf() }
                list.add(sub)

                val monthStr = DateUtils.getMonthYearStr(date)
                if (monthStr != "Unknown") {
                    monthsSet.add(monthStr)
                }
            }

            val groupedList = groupedMap.map { (date, dSubs) ->
                val total = dSubs.sumOf { it.totalCount }
                val completed = dSubs.sumOf { it.completedCount }
                val hasPending = dSubs.any { it.syncStatus == "PENDING" }

                val screenshots = dSubs.map { sub ->
                    // Use local image path if remote URL is empty (e.g. while pending offline)
                    val imgUri = if (sub.imageUrl.isNotBlank()) sub.imageUrl else (sub.localImagePath ?: "")
                    ScreenshotItem(
                        url = imgUri,
                        createdAt = sub.createdAt,
                        totalCount = sub.totalCount,
                        completedCount = sub.completedCount,
                        syncStatus = sub.syncStatus
                    )
                }

                GroupedDailySubmission(
                    date = date,
                    totalCount = total,
                    completedCount = completed,
                    screenshots = screenshots,
                    hasPendingSync = hasPending
                )
            }.sortedByDescending { DateUtils.parseDate(it.date)?.time ?: 0 }

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
            val filtered = groupedList.filter { sub ->
                val matchMonth = DateUtils.getMonthYearStr(sub.date) == currentMonth
                val matchCycle = DateUtils.dateMatchesCycle(sub.date, currentCycle)
                matchMonth && matchCycle
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                pendingSyncCount = pendingCount,
                availableMonths = availableMonths,
                groupedSubmissions = groupedList,
                filteredSubmissions = filtered,
                cycleCounts = cycleCounts
            )
        }
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

    fun deleteDailySubmission(date: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Delete from local DB first
            val toDelete = rawSubmissions.filter { it.date == date }
            for (sub in toDelete) {
                dbHelper.deleteById(sub.id)
            }

            // If online, also delete from Supabase
            if (NetworkUtils.isOnline(context)) {
                supabaseService.deleteSubmissionsByDate(agentName, date)
            }

            _uiState.value = _uiState.value.copy(
                activeDetailSubmission = null,
                isLoading = false
            )
        }
    }

    fun showFullScreenImage(url: String) {
        _uiState.value = _uiState.value.copy(fullScreenImageUrl = url)
    }

    fun hideFullScreenImage() {
        _uiState.value = _uiState.value.copy(fullScreenImageUrl = null)
    }
}
