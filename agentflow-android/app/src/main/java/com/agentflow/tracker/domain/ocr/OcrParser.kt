package com.agentflow.tracker.domain.ocr

import android.graphics.Rect
import android.util.Log
import com.agentflow.tracker.data.model.OcrExtractedCounts
import com.google.mlkit.vision.text.Text
import kotlin.math.abs

object OcrParser {

    private const val TAG = "AgentFlowOCR"

    /**
     * Primary extractor using ML Kit's structured Text hierarchy with pixel bounding boxes.
     * Accurately pairs numbers directly above the 4 runsheet grid labels:
     *   [ Total ]       [ Pending ]
     *   [ Failed ]      [ Completed ]
     */
    fun parseFromVisionText(visionText: Text): OcrExtractedCounts {
        val rawText = visionText.text
        Log.d(TAG, "Parsing VisionText:\n$rawText")

        data class DetectedItem(
            val text: String,
            val box: Rect,
            val lineText: String
        )

        val noiseWords = listOf("cash", "pos", "digital", "webpay", "mswipe", "payment", "collected", "₹", "totes")

        val allItems = mutableListOf<DetectedItem>()
        for (block in visionText.textBlocks) {
            for (line in block.lines) {
                val lineLower = line.text.lowercase()
                // Skip financial and tote noise lines entirely
                if (noiseWords.any { it in lineLower }) {
                    continue
                }
                for (elem in line.elements) {
                    val box = elem.boundingBox ?: continue
                    val cleanText = elem.text.trim()
                    if (cleanText.isNotEmpty()) {
                        allItems.add(DetectedItem(cleanText, box, line.text))
                    }
                }
            }
        }

        // 1. Identify Target Label bounding boxes
        val totalItem = allItems.firstOrNull { it.text.equals("total", ignoreCase = true) }
            ?: allItems.firstOrNull { it.text.lowercase().startsWith("total") && !it.text.lowercase().contains("completed") }

        val pendingItem = allItems.firstOrNull { it.text.equals("pending", ignoreCase = true) }
            ?: allItems.firstOrNull { it.text.lowercase().startsWith("pending") }

        val failedItem = allItems.firstOrNull { it.text.equals("failed", ignoreCase = true) }
            ?: allItems.firstOrNull { it.text.lowercase().startsWith("failed") }

        val completedItem = allItems.firstOrNull { it.text.equals("completed", ignoreCase = true) }
            ?: allItems.firstOrNull { it.text.lowercase().startsWith("completed") }

        // 2. Identify candidate numbers (items containing only digits)
        val numberItems = allItems.filter { item ->
            item.text.matches(Regex("^\\d+$"))
        }

        // Helper to find the number situated directly above a given label
        fun findNumberAbove(labelItem: DetectedItem?): Int? {
            if (labelItem == null) return null
            val lBox = labelItem.box

            // Candidate numbers above the label:
            // 1) Bottom edge is near or above the label top/center
            // 2) Horizontally aligned (same column)
            // 3) Within reasonable vertical distance
            val candidates = numberItems.filter { numItem ->
                val nBox = numItem.box
                val isAbove = nBox.bottom <= (lBox.top + lBox.height() * 0.4f)
                val verticalDist = lBox.top - nBox.bottom
                val horizDist = abs(nBox.centerX() - lBox.centerX())
                val maxHorizAllowance = maxOf(lBox.width() * 2, 140)

                isAbove && verticalDist in -20..400 && horizDist <= maxHorizAllowance
            }.sortedBy { lBox.top - it.box.bottom }

            return candidates.firstOrNull()?.text?.toIntOrNull()
        }

        var total = findNumberAbove(totalItem)
        var pending = findNumberAbove(pendingItem)
        var failed = findNumberAbove(failedItem)
        var completed = findNumberAbove(completedItem)

        Log.d(TAG, "Spatial extraction -> Total: $total, Pending: $pending, Failed: $failed, Completed: $completed")

        // 3. Fallback to Grid-Aware Text Parsing if spatial matching missed fields
        if (total == null || completed == null) {
            val textFallback = parseCountsFromOcr(rawText)
            if (total == null) total = textFallback.totalCount
            if (completed == null) completed = textFallback.completedCount
            if (failed == null) failed = textFallback.failedCount
            if (pending == null) pending = textFallback.pendingCount
        }

        // 4. Mathematical Invariant Reconciliation:
        // Total = Completed + Failed + Pending
        if (total != null && completed != null && failed != null) {
            val sum = completed + failed
            if (pending == null) {
                if (total == sum) {
                    pending = 0
                } else if (total > sum) {
                    pending = total - sum
                }
            }
        } else if (total != null && completed != null && pending != null) {
            if (failed == null && total >= completed + pending) {
                failed = total - (completed + pending)
            }
        } else if (completed != null && failed != null && pending != null && total == null) {
            total = completed + failed + pending
        }

        Log.d(TAG, "Final Result -> Total: $total, Completed: $completed, Failed: $failed, Pending: $pending")

        return OcrExtractedCounts(
            totalCount = total,
            completedCount = completed,
            failedCount = failed,
            pendingCount = pending,
            rawText = rawText
        )
    }

    /**
     * Resilient text-based parser as fallback
     */
    fun parseCountsFromOcr(rawText: String): OcrExtractedCounts {
        Log.d(TAG, "Parsing OCR fallback text:\n$rawText")

        val cleaned = rawText.replace(Regex("(?i)totes\\s*[-:]?\\s*\\d+"), "")
        val lines = cleaned.lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        val digitRegex = Regex("\\b\\d+\\b")

        var totalCount: Int? = null
        var completedCount: Int? = null
        var failedCount: Int? = null
        var pendingCount: Int? = null

        // 1. Check Row-Grouped Layouts:
        // Line N:   "46 0" or "46" / "0"
        // Line N+1: "Total Pending"
        for (i in lines.indices) {
            val lower = lines[i].lowercase()
            if (listOf("cash", "pos", "digital", "webpay", "payment").any { it in lower }) continue

            if (lower.contains("total") && lower.contains("pending")) {
                // Row above should have 2 numbers: [Total, Pending]
                if (i > 0) {
                    val nums = digitRegex.findAll(lines[i - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
                    if (nums.isNotEmpty()) {
                        totalCount = nums.first()
                        if (nums.size > 1) pendingCount = nums[1]
                    }
                }
            }

            if (lower.contains("failed") && lower.contains("completed")) {
                // Row above should have 2 numbers: [Failed, Completed]
                if (i > 0) {
                    val nums = digitRegex.findAll(lines[i - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
                    if (nums.isNotEmpty()) {
                        failedCount = nums.first()
                        if (nums.size > 1) completedCount = nums.last()
                    }
                }
            }
        }

        // 2. Individual Line Offsets (Column format)
        var totalIdx: Int? = null
        var compIdx: Int? = null
        var failIdx: Int? = null
        var pendIdx: Int? = null

        for (i in lines.indices) {
            val lower = lines[i].lowercase()
            if (listOf("cash", "pos", "digital", "webpay", "payment").any { it in lower }) continue

            if (lower.contains("total") && !lower.contains("completed") && totalIdx == null) totalIdx = i
            if (lower.contains("completed") && compIdx == null) compIdx = i
            if (lower.contains("failed") && failIdx == null) failIdx = i
            if (lower.contains("pending") && pendIdx == null) pendIdx = i
        }

        // Same-line checks
        if (totalIdx != null && totalCount == null) {
            val line = lines[totalIdx]
            val m = Regex("(?i)\\btotal\\b\\s*[:\\-\\s]\\s*(\\d+)").find(line)
                ?: Regex("(?i)(\\d+)\\s*[:\\-\\s]\\s*\\btotal\\b").find(line)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { totalCount = it }
        }

        if (compIdx != null && completedCount == null) {
            val line = lines[compIdx]
            val m = Regex("(?i)\\bcompleted\\b\\s*[:\\-\\s]\\s*(\\d+)").find(line)
                ?: Regex("(?i)(\\d+)\\s*[:\\-\\s]\\s*\\bcompleted\\b").find(line)
            m?.groupValues?.get(1)?.toIntOrNull()?.let { completedCount = it }
        }

        // Multi-line positional check (number above label)
        if (totalIdx != null && totalCount == null && totalIdx > 0) {
            val numsAbove = digitRegex.findAll(lines[totalIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
            if (numsAbove.isNotEmpty()) totalCount = numsAbove.first()
        }

        if (compIdx != null && completedCount == null && compIdx > 0) {
            val numsAbove = digitRegex.findAll(lines[compIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
            if (numsAbove.isNotEmpty()) completedCount = numsAbove.last()
        }

        if (pendIdx != null && pendingCount == null && pendIdx > 0) {
            val numsAbove = digitRegex.findAll(lines[pendIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
            if (numsAbove.isNotEmpty()) pendingCount = numsAbove.last()
        }

        if (failIdx != null && failedCount == null && failIdx > 0) {
            val numsAbove = digitRegex.findAll(lines[failIdx - 1]).mapNotNull { it.value.toIntOrNull() }.toList()
            if (numsAbove.isNotEmpty()) failedCount = numsAbove.first()
        }

        return OcrExtractedCounts(
            totalCount = totalCount,
            completedCount = completedCount,
            failedCount = failedCount,
            pendingCount = pendingCount,
            rawText = rawText
        )
    }
}
