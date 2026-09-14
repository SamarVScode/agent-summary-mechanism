package com.agentflow.tracker

import com.agentflow.tracker.domain.ocr.OcrParser
import org.junit.Assert.assertEquals
import org.junit.Test

class OcrParserTest {

    @Test
    fun testParseStandardLayout() {
        val sampleOcr = """
            Agent Dashboard
            72          0
            Total      Pending
            
            9          63
            Failed   Completed
        """.trimIndent()

        val result = OcrParser.parseCountsFromOcr(sampleOcr)
        assertEquals(72, result.totalCount)
        assertEquals(63, result.completedCount)
    }

    @Test
    fun testParseFallbackRegex() {
        val sampleOcr = """
            Summary report:
            Total: 85 items processed
            Completed: 80 items successfully
        """.trimIndent()

        val result = OcrParser.parseCountsFromOcr(sampleOcr)
        assertEquals(85, result.totalCount)
        assertEquals(80, result.completedCount)
    }

    @Test
    fun testParseLinebreakRegex() {
        val sampleOcr = """
            55
            total
            48
            completed
        """.trimIndent()

        val result = OcrParser.parseCountsFromOcr(sampleOcr)
        assertEquals(55, result.totalCount)
        assertEquals(48, result.completedCount)
    }
}
