package com.agentflow.tracker.ui.screens.leave

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agentflow.tracker.data.model.LeaveRequest
import com.agentflow.tracker.ui.theme.PinkPrimary
import com.agentflow.tracker.ui.theme.SuccessGreen
import com.agentflow.tracker.ui.theme.SuccessGreenLight
import com.agentflow.tracker.ui.theme.WarningYellow
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun LeaveCalendarView(
    calendarMonth: Calendar,
    userLeaves: List<LeaveRequest>,
    teamLeaves: List<LeaveRequest>,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onDateClick: (Date) -> Unit
) {
    val monthTitle = SimpleDateFormat("MMMM yyyy", Locale.US).format(calendarMonth.time)
    val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    val year = calendarMonth.get(Calendar.YEAR)
    val month = calendarMonth.get(Calendar.MONTH)

    // Build days array for current month (cached to avoid re-computation on every frame)
    val daysList = remember(year, month) {
        val cal = (calendarMonth.clone() as Calendar).apply {
            set(Calendar.DAY_OF_MONTH, 1)
        }
        val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1 // 0 for Sunday
        val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

        val list = mutableListOf<Date?>()
        for (i in 0 until firstDayOfWeek) {
            list.add(null)
        }
        for (day in 1..daysInMonth) {
            val d = Calendar.getInstance().apply {
                set(year, month, day)
            }.time
            list.add(d)
        }
        // Pad trailing days to always complete the final 7-day row
        while (list.size % 7 != 0) {
            list.add(null)
        }
        list
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Month Header Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onPrevMonth) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = "Prev")
                }
                Text(
                    text = monthTitle,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                IconButton(onClick = onNextMonth) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = "Next")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Day-of-week headers (S M T W T F S)
            val weekDays = listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa")
            Row(modifier = Modifier.fillMaxWidth()) {
                weekDays.forEach { w ->
                    Text(
                        text = w,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 7-column Calendar Grid
            val rows = daysList.chunked(7)
            rows.forEach { week ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    week.forEach { date ->
                        if (date == null) {
                            Spacer(modifier = Modifier.weight(1f).aspectRatio(1f))
                        } else {
                            val dateStr = isoFormat.format(date)
                            val isApprovedMe = userLeaves.any {
                                it.status == "approved" && dateStr >= it.startDate && dateStr <= it.endDate
                            }
                            val hasTeamLeave = teamLeaves.any {
                                dateStr >= it.startDate && dateStr <= it.endDate
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .clip(CircleShape)
                                    .background(
                                        when {
                                            isApprovedMe -> SuccessGreenLight
                                            hasTeamLeave -> MaterialTheme.colorScheme.surfaceVariant
                                            else -> Color.Transparent
                                        }
                                    )
                                    .clickable { onDateClick(date) },
                                contentAlignment = Alignment.Center
                            ) {
                                val calDay = Calendar.getInstance().apply { time = date }.get(Calendar.DAY_OF_MONTH)
                                Text(
                                    text = calDay.toString(),
                                    fontSize = 13.sp,
                                    fontWeight = if (isApprovedMe) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isApprovedMe) SuccessGreen else MaterialTheme.colorScheme.onSurface
                                )
                                if (hasTeamLeave && !isApprovedMe) {
                                    Box(
                                        modifier = Modifier
                                            .size(4.dp)
                                            .align(Alignment.BottomCenter)
                                            .padding(bottom = 2.dp)
                                            .background(WarningYellow, CircleShape)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
