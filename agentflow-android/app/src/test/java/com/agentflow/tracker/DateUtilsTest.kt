package com.agentflow.tracker

import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DateUtilsTest {

    @Test
    fun testMonthNormalization() {
        assertEquals("Sep", DateUtils.normalizeMonth("Sep"))
        assertEquals("Sep", DateUtils.normalizeMonth("Sept"))
        assertEquals("Sep", DateUtils.normalizeMonth("09"))
        assertEquals("Jan", DateUtils.normalizeMonth("January"))
    }

    @Test
    fun testGetMonthYearStr() {
        assertEquals("Sep 2026", DateUtils.getMonthYearStr("14-Sep-2026"))
        assertEquals("Sep 2026", DateUtils.getMonthYearStr("14-Sept-2026"))
        assertEquals("Sep 2026", DateUtils.getMonthYearStr("2026-09-14"))
    }

    @Test
    fun testCycleMatching() {
        // Cycle 1: 1 to 15
        assertTrue(DateUtils.dateMatchesCycle("01-Sep-2026", "c1"))
        assertTrue(DateUtils.dateMatchesCycle("15-Sep-2026", "c1"))
        assertFalse(DateUtils.dateMatchesCycle("16-Sep-2026", "c1"))

        // Cycle 2: 16 to End
        assertFalse(DateUtils.dateMatchesCycle("15-Sep-2026", "c2"))
        assertTrue(DateUtils.dateMatchesCycle("16-Sep-2026", "c2"))
        assertTrue(DateUtils.dateMatchesCycle("30-Sep-2026", "c2"))

        // All
        assertTrue(DateUtils.dateMatchesCycle("05-Sep-2026", "all"))
        assertTrue(DateUtils.dateMatchesCycle("20-Sep-2026", "all"))
    }

    @Test
    fun testCycleStatsCalculation() {
        val subs = listOf(
            Submission(date = "05-Sep-2026", completedCount = 50),
            Submission(date = "15-Sep-2026", completedCount = 30),
            Submission(date = "16-Sep-2026", completedCount = 40),
            Submission(date = "22-Sep-2026", completedCount = 60),
            Submission(date = "01-Aug-2026", completedCount = 100) // Different month
        )

        val stats = DateUtils.calculateCycleStats(subs, "Sep 2026", 13.0)
        assertEquals(80, stats.c1Completed)
        assertEquals(1040.0, stats.c1Earnings, 0.01) // 80 * 13

        assertEquals(100, stats.c2Completed)
        assertEquals(1300.0, stats.c2Earnings, 0.01) // 100 * 13

        assertEquals(180, stats.totalCompleted)
        assertEquals(2340.0, stats.totalEarnings, 0.01) // 180 * 13
    }
}
