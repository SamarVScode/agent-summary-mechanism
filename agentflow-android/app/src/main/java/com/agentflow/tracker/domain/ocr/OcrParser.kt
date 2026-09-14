package com.agentflow.tracker.domain.ocr

import android.util.Log
import com.agentflow.tracker.data.model.OcrExtractedCounts

object OcrParser {

    private const val TAG = "AgentFlowOCR"

    /**
     * Resilient multi-directional parser supporting:
     * - Numbers above labels (2x2 grid / column format)
     * - Numbers below labels
     * - Same-line values ("Total: 72", "Completed: 63", "72 Total")
     * - Bi-directional regex fallback
     * - Filters out noise like "Totes - 0", "Cash Collected", etc.
     */
    fun parseCountsFromOcr(rawText: String): OcrExtractedCounts {
        Log.d(TAG, "Parsing OCR text:\n$rawText")

        val cleaned = rawText.replace(Regex("(?i)totes\\s*[-:]?\\s*\\d+"), "")
        val lines = cleaned.lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        val digitRegex = Regex("\\b\\d+\\b")

        var totalIdx: Int? = null
        var compIdx: Int? = null

        for (i in lines.indices) {
            val lower = lines[i].lowercase()
            if (listOf("cash", "pos", "digital", "webpay", "payment").any { it in lower }) {
                continue
            }
            if (lower.contains("total") && !lower.contains("completed") && totalIdx == null) {
                totalIdx = i
            }
            if (lower.contains("completed") && compIdx == null) {
                compIdx = i
            }
        }

        var totalCount: Int? = null
        var completedCount: Int? = null

        // 1. Same-line check (e.g. "Total: 72", "72 Total", "Completed: 63")
        if (totalIdx != null) {
            val line = lines[totalIdx]
            val m = Regex("(?i)\\btotal\\b\\s*[:\\-\\s]\\s*(\\d+)").find(line)
                ?: Regex("(?i)(\\d+)\\s*[:\\-\\s]\\s*\\btotal\\b").find(line)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { totalCount = it }
        }

        if (compIdx != null) {
            val line = lines[compIdx]
            val m = Regex("(?i)\\bcompleted\\b\\s*[:\\-\\s]\\s*(\\d+)").find(line)
                ?: Regex("(?i)(\\d+)\\s*[:\\-\\s]\\s*\\bcompleted\\b").find(line)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { completedCount = it }
        }

        // 2. Multi-line positional check (Numbers Above vs Numbers Below)
        if (totalIdx != null && (totalCount == null || completedCount == null)) {
            val numsAboveTotal = if (totalIdx > 0) digitRegex.findAll(lines[totalIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList() else emptyList()
            val numsBelowTotal = if (totalIdx < lines.size - 1) digitRegex.findAll(lines[totalIdx + 1]).mapNotNull { it.value.toIntOrNull() }.toList() else emptyList()

            if (numsAboveTotal.isNotEmpty() && (numsBelowTotal.isEmpty() || numsAboveTotal.size >= numsBelowTotal.size)) {
                // Layout: Numbers are ABOVE labels (e.g. "72 0" above "Total Pending")
                if (totalCount == null && numsAboveTotal.isNotEmpty()) {
                    totalCount = numsAboveTotal.first()
                }
                if (completedCount == null && compIdx != null && compIdx > 0) {
                    val numsAboveComp = digitRegex.findAll(lines[compIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
                    if (numsAboveComp.isNotEmpty()) {
                        completedCount = numsAboveComp.last()
                    }
                }
            } else if (numsBelowTotal.isNotEmpty()) {
                // Layout: Numbers are BELOW labels (e.g. "Total" then "72")
                if (totalCount == null) {
                    totalCount = numsBelowTotal.first()
                }
                if (completedCount == null && compIdx != null && compIdx < lines.size - 1) {
                    val numsBelowComp = digitRegex.findAll(lines[compIdx + 1]).mapNotNull { it.value.toIntOrNull() }.toList()
                    if (numsBelowComp.isNotEmpty()) {
                        completedCount = numsBelowComp.first()
                    }
                }
            }
        }

        // 3. Bi-directional Regex Fallback
        if (totalCount == null) {
            val m = Regex("(?i)\\btotal\\b\\D{0,10}(\\d+)").find(cleaned)
                ?: Regex("(?i)(\\d+)\\D{0,10}\\btotal\\b").find(cleaned)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { totalCount = it }
        }

        if (completedCount == null) {
            val m = Regex("(?i)\\bcompleted\\b\\D{0,10}(\\d+)").find(cleaned)
                ?: Regex("(?i)(\\d+)\\D{0,10}\\bcompleted\\b").find(cleaned)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { completedCount = it }
        }

        Log.d(TAG, "Extracted -> Total: $totalCount, Completed: $completedCount")

        return OcrExtractedCounts(
            totalCount = totalCount,
            completedCount = completedCount,
            rawText = rawText
        )
    }
}
