package com.agentflow.tracker.ui.screens.leave

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agentflow.tracker.ui.components.TeamOverlapDialog
import com.agentflow.tracker.ui.theme.ErrorRed
import com.agentflow.tracker.ui.theme.PinkPrimary
import com.agentflow.tracker.ui.theme.SuccessGreen
import com.agentflow.tracker.ui.theme.SuccessGreenLight
import com.agentflow.tracker.ui.theme.WarningYellow
import com.agentflow.tracker.ui.theme.WarningYellowLight

import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.LaunchedEffect
import com.agentflow.tracker.ui.theme.GradientPink

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveScreen(viewModel: LeaveViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    // Auto-sync leaves whenever this tab is opened
    LaunchedEffect(Unit) {
        viewModel.loadLeaves()
    }

    PullToRefreshBox(
        isRefreshing = uiState.isLoading,
        onRefresh = { viewModel.loadLeaves() },
        modifier = Modifier.fillMaxSize()
    ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 20.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Leave Management",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Request and view your leaves",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }

                        IconButton(onClick = { viewModel.loadLeaves() }) {
                            Icon(
                                imageVector = Icons.Default.Sync,
                                contentDescription = "Refresh",
                                tint = GradientPink
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

            // Month Calendar
            item {
                LeaveCalendarView(
                    calendarMonth = uiState.calendarMonth,
                    userLeaves = uiState.userLeaves,
                    teamLeaves = uiState.approvedTeamLeaves,
                    onPrevMonth = viewModel::prevMonth,
                    onNextMonth = viewModel::nextMonth,
                    onDateClick = viewModel::onDateClicked
                )
                Spacer(modifier = Modifier.height(24.dp))
            }

            // Leave Requests List Header
            item {
                Text(
                    text = "Your Leave Requests",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }

            if (uiState.userLeaves.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Text(
                            text = "No leave requests submitted yet. Tap any date above to request time off.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(20.dp)
                        )
                    }
                }
            } else {
                items(uiState.userLeaves) { leave ->
                    val isPending = leave.status.lowercase() == "pending"
                    val isApproved = leave.status.lowercase() == "approved"

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${leave.startDate} ➜ ${leave.endDate}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                // Status Badge
                                val (statusBg, statusColor) = when {
                                    isApproved -> Pair(SuccessGreenLight, SuccessGreen)
                                    isPending -> Pair(WarningYellowLight, WarningYellow)
                                    else -> Pair(ErrorRed.copy(alpha = 0.12f), ErrorRed)
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(statusBg)
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = leave.status.replaceFirstChar { it.uppercase() },
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = statusColor
                                    )
                                }
                            }

                            if (leave.reason.isNotBlank()) {
                                Text(
                                    text = "Reason: ${leave.reason}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }

                            // Actions if Pending
                            if (isPending) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 10.dp),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    IconButton(
                                        onClick = { viewModel.onEditLeaveClicked(leave) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Edit",
                                            tint = PinkPrimary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    if (leave.id != null) {
                                        IconButton(
                                            onClick = { viewModel.cancelLeave(leave.id) },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.DeleteOutline,
                                                contentDescription = "Cancel",
                                                tint = ErrorRed,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }

        // Checking Overlap Fullscreen Loading Overlay
        if (uiState.isCheckingOverlap) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = PinkPrimary)
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Checking team schedule...",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }

    // Duration Picker Modal Sheet
    LeaveDurationSheet(
        visible = uiState.showDurationSheet,
        startDate = uiState.selectedStartDate,
        durationDays = uiState.durationDays,
        reason = uiState.reason,
        isEditing = uiState.editingLeaveId != null,
        isSubmitting = uiState.isSubmitting,
        onDurationChanged = viewModel::onDurationChanged,
        onReasonChanged = viewModel::onReasonChanged,
        onSubmit = viewModel::requestLeaveSubmit,
        onDismiss = viewModel::dismissDurationSheet
    )

    // Team Overlap Warning Dialog
    if (uiState.overlappingAgents != null) {
        TeamOverlapDialog(
            overlappingAgents = uiState.overlappingAgents!!,
            onConfirm = viewModel::confirmOverlapAndSubmit,
            onDismiss = viewModel::dismissOverlapDialog
        )
    }
}
