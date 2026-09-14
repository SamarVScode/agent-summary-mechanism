package com.agentflow.tracker.domain.date

import com.agentflow.tracker.data.model.CycleStats
import com.agentflow.tracker.data.model.Submission
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object DateUtils {

    val MONTHS_3 = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

    fun formatDate(date: Date = Date()): String {
        val cal = Calendar.getInstance().apply { time = date }
        val day = String.format(Locale.US, "%02d", cal.get(Calendar.DAY_OF_MONTH))
        val month = MONTHS_3[cal.get(Calendar.MONTH)]
        val year = cal.get(Calendar.YEAR)
        return "$day-$month-$year"
    }

    fun getCurrentMonthYear(): String {
        val cal = Calendar.getInstance()
        return "${MONTHS_3[cal.get(Calendar.MONTH)]} ${cal.get(Calendar.YEAR)}"
    }

    fun getCurrentCycle(): String {
        val cal = Calendar.getInstance()
        val day = cal.get(Calendar.DAY_OF_MONTH)
        return if (day <= 15) "c1" else "c2"
    }

    fun normalizeMonth(rawMonth: String): String {
        val trimmed = rawMonth.trim()
        val monthNum = trimmed.toIntOrNull()
        if (monthNum != null && monthNum in 1..12) {
            return MONTHS_3[monthNum - 1]
        }
        val prefix = trimmed.take(3).lowercase()
        return when (prefix) {
            "jan" -> "Jan"
            "feb" -> "Feb"
            "mar" -> "Mar"
            "apr" -> "Apr"
            "may" -> "May"
            "jun" -> "Jun"
            "jul" -> "Jul"
            "aug" -> "Aug"
            "sep" -> "Sep"
            "oct" -> "Oct"
            "nov" -> "Nov"
            "dec" -> "Dec"
            else -> "Unknown"
        }
    }

    fun getMonthYearStr(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "Unknown"
        val parts = dateStr.split("-")
        return when {
            parts.size == 3 && parts[0].length <= 2 -> { // DD-MMM-YYYY
                val month = normalizeMonth(parts[1])
                "$month ${parts[2]}"
            }
            parts.size == 3 && parts[0].length == 4 -> { // YYYY-MM-DD
                val month = normalizeMonth(parts[1])
                "$month ${parts[0]}"
            }
            else -> "Unknown"
        }
    }

    fun getDayFromDate(dateStr: String?): Int? {
        if (dateStr.isNullOrBlank()) return null
        val parts = dateStr.split("-")
        return when {
            parts.size == 3 && parts[0].length <= 2 -> parts[0].toIntOrNull() // DD-MMM-YYYY
            parts.size == 3 && parts[0].length == 4 -> parts[2].toIntOrNull() // YYYY-MM-DD
            else -> null
        }
    }

    fun dateMatchesCycle(dateStr: String?, cycle: String): Boolean {
        if (cycle == "all") return true
        val day = getDayFromDate(dateStr) ?: return false
        return when (cycle) {
            "c1" -> day in 1..15
            "c2" -> day >= 16
            else -> true
        }
    }

    fun calculateCycleStats(submissions: List<Submission>, selectedMonth: String, rateAmount: Double): CycleStats {
        var c1Completed = 0
        var c2Completed = 0

        for (sub in submissions) {
            if (getMonthYearStr(sub.date) == selectedMonth) {
                val day = getDayFromDate(sub.date) ?: continue
                if (day in 1..15) {
                    c1Completed += sub.completedCount
                } else if (day >= 16) {
                    c2Completed += sub.completedCount
                }
            }
        }

        val totalCompleted = c1Completed + c2Completed
        return CycleStats(
            c1Earnings = c1Completed * rateAmount,
            c1Completed = c1Completed,
            c2Earnings = c2Completed * rateAmount,
            c2Completed = c2Completed,
            totalEarnings = totalCompleted * rateAmount,
            totalCompleted = totalCompleted
        )
    }

    fun parseDate(dateStr: String): Date? {
        val parts = dateStr.split("-")
        return try {
            if (parts.size == 3 && parts[0].length == 4) {
                SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(dateStr)
            } else {
                val day = parts[0]
                val month = normalizeMonth(parts[1])
                val year = parts[2]
                SimpleDateFormat("dd-MMM-yyyy", Locale.US).parse("$day-$month-$year")
            }
        } catch (e: Exception) {
            null
        }
    }
}
