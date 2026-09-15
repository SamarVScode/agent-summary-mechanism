package com.agentflow.tracker.data.local

data class LocalSubmission(
    val id: String,
    val date: String,
    val agentName: String,
    val casperId: String,
    val totalCount: Int,
    val completedCount: Int,
    val imageUrl: String,
    val localImagePath: String?,
    val fileHash: String,
    val syncStatus: String, // "PENDING", "SYNCED"
    val createdAt: String
)
