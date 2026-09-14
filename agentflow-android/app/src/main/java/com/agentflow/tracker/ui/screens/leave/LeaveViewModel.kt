package com.agentflow.tracker.ui.screens.leave

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.model.LeaveRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class LeaveUiState(
    val isLoading: Boolean = true,
    val isCheckingOverlap: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val userLeaves: List<LeaveRequest> = emptyList(),
    val approvedTeamLeaves: List<LeaveRequest> = emptyList(),
    val calendarMonth: Calendar = Calendar.getInstance().apply { set(Calendar.DAY_OF_MONTH, 1) },
    val showDurationSheet: Boolean = false,
    val selectedStartDate: String = "",
    val durationDays: Int = 1,
    val reason: String = "",
    val editingLeaveId: String? = null,
    val overlappingAgents: List<String>? = null,
    val hasUnreadLeaves: Boolean = false
)

class LeaveViewModel(
    private val supabaseService: SupabaseService,
    private val agentName: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveUiState())
    val uiState: StateFlow<LeaveUiState> = _uiState.asStateFlow()

    private val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    init {
        loadLeaves()
        checkUnreadNotifications()
    }

    fun loadLeaves() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val agentRes = supabaseService.fetchAgentLeaves(agentName)
            val teamRes = supabaseService.fetchApprovedTeamLeaves()

            if (agentRes.isSuccess && teamRes.isSuccess) {
                val leaves = agentRes.getOrThrow()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    userLeaves = leaves,
                    approvedTeamLeaves = teamRes.getOrThrow()
                )
                // Mark any unread leaves as read since user is on Leave tab
                val unreadIds = leaves.filter { !it.isRead && it.id != null }.mapNotNull { it.id }
                if (unreadIds.isNotEmpty()) {
                    supabaseService.markLeavesAsRead(unreadIds)
                    _uiState.value = _uiState.value.copy(hasUnreadLeaves = false)
                }
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = agentRes.exceptionOrNull()?.message ?: "Failed to fetch leaves"
                )
            }
        }
    }

    fun checkUnreadNotifications() {
        viewModelScope.launch {
            val res = supabaseService.checkUnreadLeaves(agentName)
            res.onSuccess { ids ->
                _uiState.value = _uiState.value.copy(hasUnreadLeaves = ids.isNotEmpty())
            }
        }
    }

    fun prevMonth() {
        val cal = (_uiState.value.calendarMonth.clone() as Calendar).apply {
            add(Calendar.MONTH, -1)
        }
        _uiState.value = _uiState.value.copy(calendarMonth = cal)
    }

    fun nextMonth() {
        val cal = (_uiState.value.calendarMonth.clone() as Calendar).apply {
            add(Calendar.MONTH, 1)
        }
        _uiState.value = _uiState.value.copy(calendarMonth = cal)
    }

    fun onDateClicked(date: Date) {
        val dateStr = isoFormat.format(date)
        _uiState.value = _uiState.value.copy(
            selectedStartDate = dateStr,
            durationDays = 1,
            reason = "",
            editingLeaveId = null,
            showDurationSheet = true
        )
    }

    fun onEditLeaveClicked(leave: LeaveRequest) {
        try {
            val start = isoFormat.parse(leave.startDate)
            val end = isoFormat.parse(leave.endDate)
            val diffTime = (end?.time ?: 0) - (start?.time ?: 0)
            val days = (diffTime / (1000 * 60 * 60 * 24)).toInt() + 1

            _uiState.value = _uiState.value.copy(
                selectedStartDate = leave.startDate,
                durationDays = days.coerceAtLeast(1),
                reason = leave.reason,
                editingLeaveId = leave.id,
                showDurationSheet = true
            )
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(errorMessage = "Could not edit leave")
        }
    }

    fun dismissDurationSheet() {
        _uiState.value = _uiState.value.copy(showDurationSheet = false, editingLeaveId = null)
    }

    fun onDurationChanged(days: Int) {
        _uiState.value = _uiState.value.copy(durationDays = days.coerceAtLeast(1))
    }

    fun onReasonChanged(reason: String) {
        _uiState.value = _uiState.value.copy(reason = reason)
    }

    fun requestLeaveSubmit() {
        val startStr = _uiState.value.selectedStartDate
        val duration = _uiState.value.durationDays
        if (startStr.isBlank()) return

        val startCal = Calendar.getInstance().apply {
            time = isoFormat.parse(startStr) ?: Date()
        }
        val endCal = (startCal.clone() as Calendar).apply {
            add(Calendar.DAY_OF_MONTH, duration - 1)
        }
        val endStr = isoFormat.format(endCal.time)

        _uiState.value = _uiState.value.copy(
            showDurationSheet = false,
            isCheckingOverlap = true
        )

        viewModelScope.launch {
            val overlapRes = supabaseService.checkLeaveOverlap(agentName, startStr, endStr)
            _uiState.value = _uiState.value.copy(isCheckingOverlap = false)

            overlapRes.onSuccess { overlappingAgents ->
                if (overlappingAgents.isNotEmpty()) {
                    _uiState.value = _uiState.value.copy(overlappingAgents = overlappingAgents)
                } else {
                    executeSubmit(startStr, endStr)
                }
            }.onFailure {
                // If overlap check network failed, attempt direct submission
                executeSubmit(startStr, endStr)
            }
        }
    }

    fun confirmOverlapAndSubmit() {
        val startStr = _uiState.value.selectedStartDate
        val duration = _uiState.value.durationDays
        val startCal = Calendar.getInstance().apply {
            time = isoFormat.parse(startStr) ?: Date()
        }
        val endCal = (startCal.clone() as Calendar).apply {
            add(Calendar.DAY_OF_MONTH, duration - 1)
        }
        val endStr = isoFormat.format(endCal.time)

        _uiState.value = _uiState.value.copy(overlappingAgents = null)
        executeSubmit(startStr, endStr)
    }

    fun dismissOverlapDialog() {
        _uiState.value = _uiState.value.copy(overlappingAgents = null)
    }

    private fun executeSubmit(startDate: String, endDate: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            val res = supabaseService.submitLeaveRequest(
                agentName = agentName,
                startDate = startDate,
                endDate = endDate,
                reason = _uiState.value.reason,
                editingId = _uiState.value.editingLeaveId
            )
            _uiState.value = _uiState.value.copy(isSubmitting = false)
            res.onSuccess {
                loadLeaves()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(errorMessage = err.message ?: "Submission failed")
            }
        }
    }

    fun cancelLeave(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val res = supabaseService.cancelLeaveRequest(id)
            res.onSuccess {
                loadLeaves()
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = err.message ?: "Failed to cancel leave"
                )
            }
        }
    }
}
