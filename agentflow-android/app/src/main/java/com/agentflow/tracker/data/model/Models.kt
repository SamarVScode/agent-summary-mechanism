package com.agentflow.tracker.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Agent(
    @SerialName("casper_id") val casperId: String = "",
    @SerialName("name") val name: String = "",
    @SerialName("password") val password: String = "",
    @SerialName("rate_amount") val rateAmount: Double = 13.0
)

@Serializable
data class Submission(
    @SerialName("id") val id: String? = null,
    @SerialName("date") val date: String = "",
    @SerialName("agent_name") val agentName: String = "",
    @SerialName("casper_id") val casperId: String = "",
    @SerialName("total_count") val totalCount: Int = 0,
    @SerialName("completed_count") val completedCount: Int = 0,
    @SerialName("image_url") val imageUrl: String = "",
    @SerialName("file_hash") val fileHash: String = "",
    @SerialName("processed") val processed: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class LeaveRequest(
    @SerialName("id") val id: String? = null,
    @SerialName("agent_name") val agentName: String = "",
    @SerialName("start_date") val startDate: String = "",
    @SerialName("end_date") val endDate: String = "",
    @SerialName("reason") val reason: String = "",
    @SerialName("status") val status: String = "pending", // "pending", "approved", "rejected"
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
)

data class ScreenshotItem(
    val url: String,
    val createdAt: String?,
    val totalCount: Int,
    val completedCount: Int,
    val syncStatus: String = "SYNCED"
)

data class GroupedDailySubmission(
    val date: String,
    val totalCount: Int,
    val completedCount: Int,
    val screenshots: List<ScreenshotItem>,
    val hasPendingSync: Boolean = false
)

data class CycleStats(
    val c1Earnings: Double,
    val c1Completed: Int,
    val c2Earnings: Double,
    val c2Completed: Int,
    val totalEarnings: Double,
    val totalCompleted: Int
)

data class OcrExtractedCounts(
    val totalCount: Int?,
    val completedCount: Int?,
    val failedCount: Int? = null,
    val pendingCount: Int? = null,
    val rawText: String
)
