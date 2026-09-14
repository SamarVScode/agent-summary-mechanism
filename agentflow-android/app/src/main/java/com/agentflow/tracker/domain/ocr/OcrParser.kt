package com.agentflow.tracker.domain.ocr

import com.agentflow.tracker.data.model.OcrExtractedCounts

object OcrParser {

    /**
     * Finds the number above "Total" and above "Completed" in the OCR text.
     *
     * Screenshot layout:
     *   72          0
     *  Total      Pending
     *
     *   9          63
     *  Failed   Completed
     */
    fun parseCountsFromOcr(rawText: String): OcrExtractedCounts {
        val lines = rawText.lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        var totalCount: Int? = null
        var completedCount: Int? = null

        val digitRegex = Regex("\\d+")

        fun getTokensAbove(index: Int): List<Int> {
            val prevLine = if (index > 0) lines[index - 1] else lines[index]
            return digitRegex.findAll(prevLine).mapNotNull { it.value.toIntOrNull() }.toList()
        }

        for (i in lines.indices) {
            val lower = lines[i].lowercase()

            // ── Find "Total" label ──────────────────────────────────────────
            if (lower.contains("total") && !lower.contains("completed")) {
                val tokens = getTokensAbove(i)
                if (tokens.isNotEmpty()) {
                    totalCount = tokens.first() // left-most number = Total
                }
            }

            // ── Find "Completed" label ──────────────────────────────────────
            if (lower.contains("completed")) {
                val tokens = getTokensAbove(i)
                if (tokens.isNotEmpty()) {
                    completedCount = tokens.last() // right-most number = Completed
                }
            }
        }

        // ── Fallback regex on whole text ──────────────────────────────────
        if (totalCount == null) {
            val match = Regex("(\\d+)\\s*\\n?\\s*total", RegexOption.IGNORE_CASE).find(rawText)
            match?.groupValues?.get(1)?.toIntOrNull()?.let { totalCount = it }
        }

        if (completedCount == null) {
            val match = Regex("(\\d+)\\s*\\n?\\s*completed", RegexOption.IGNORE_CASE).find(rawText)
            match?.groupValues?.get(1)?.toIntOrNull()?.let { completedCount = it }
        }

        return OcrExtractedCounts(
            totalCount = totalCount,
            completedCount = completedCount,
            rawText = rawText
        )
    }
}
