package com.agentflow.tracker.data.api

import com.agentflow.tracker.data.model.Agent
import com.agentflow.tracker.data.model.LeaveRequest
import com.agentflow.tracker.data.model.Submission
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class SupabaseService {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
        explicitNulls = false
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val baseUrl = SupabaseConfig.BASE_URL
    private val anonKey = SupabaseConfig.ANON_KEY

    private fun newRequestBuilder(url: String): Request.Builder {
        return Request.Builder()
            .url(url)
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $anonKey")
    }

    // ── Authentication ──────────────────────────────────────────────────────────
    suspend fun getAgentByCasperId(casperId: String): Result<Agent> = withContext(Dispatchers.IO) {
        try {
            val encodedId = URLEncoder.encode(casperId, "UTF-8")
            val url = "$baseUrl/rest/v1/agents?casper_id=eq.$encodedId&select=*"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Server error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Agent>>(bodyStr)
                if (list.isEmpty()) {
                    Result.failure(Exception("Invalid Casper ID"))
                } else {
                    Result.success(list.first())
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ── Submissions & Deduplication ─────────────────────────────────────────────
    suspend fun checkDuplicateHash(fileHash: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/submissions?file_hash=eq.$fileHash&select=id"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Duplicate check error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Map<String, String>>>(bodyStr)
                Result.success(list.isNotEmpty())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkDuplicateSubmission(casperId: String, date: String, total: Int, completed: Int): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val encodedCasper = URLEncoder.encode(casperId, "UTF-8")
            val encodedDate = URLEncoder.encode(date, "UTF-8")
            val url = "$baseUrl/rest/v1/submissions?casper_id=eq.$encodedCasper&date=eq.$encodedDate&total_count=eq.$total&completed_count=eq.$completed&select=id"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Duplicate submission check error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Map<String, String>>>(bodyStr)
                Result.success(list.isNotEmpty())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadScreenshot(fileName: String, imageBytes: ByteArray, mimeType: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val bucket = SupabaseConfig.STORAGE_BUCKET
                val url = "$baseUrl/storage/v1/object/$bucket/$fileName"
                val body = imageBytes.toRequestBody(mimeType.toMediaType())

                val request = newRequestBuilder(url)
                    .addHeader("Content-Type", mimeType)
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        val errText = response.body?.string().orEmpty()
                        return@withContext Result.failure(
                            IOException("Screenshot upload failed (${response.code}): $errText")
                        )
                    }
                    val publicUrl = "$baseUrl/storage/v1/object/public/$bucket/$fileName"
                    Result.success(publicUrl)
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun insertSubmission(submission: Submission): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/submissions"
            val bodyJson = json.encodeToString(submission)
            val requestBody = bodyJson.toRequestBody("application/json".toMediaType())

            val request = newRequestBuilder(url)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errText = response.body?.string().orEmpty()
                    return@withContext Result.failure(
                        IOException("Database insert failed (${response.code}): $errText")
                    )
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchSubmissions(agentName: String): Result<List<Submission>> = withContext(Dispatchers.IO) {
        try {
            val encodedName = URLEncoder.encode(agentName, "UTF-8")
            val url = "$baseUrl/rest/v1/submissions?agent_name=eq.$encodedName&order=date.desc"
            val request = newRequestBuilder(url)
                .addHeader("Cache-Control", "no-cache")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Fetch error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Submission>>(bodyStr)
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteSubmissionsByDate(agentName: String, date: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val encodedName = URLEncoder.encode(agentName, "UTF-8")
            val encodedDate = URLEncoder.encode(date, "UTF-8")
            val url = "$baseUrl/rest/v1/submissions?agent_name=eq.$encodedName&date=eq.$encodedDate"
            val request = newRequestBuilder(url)
                .delete()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errText = response.body?.string().orEmpty()
                    return@withContext Result.failure(IOException("Delete error (${response.code}): $errText"))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ── Leave Requests ──────────────────────────────────────────────────────────
    suspend fun fetchAgentLeaves(agentName: String): Result<List<LeaveRequest>> = withContext(Dispatchers.IO) {
        try {
            val encodedName = URLEncoder.encode(agentName, "UTF-8")
            val url = "$baseUrl/rest/v1/leave_requests?agent_name=eq.$encodedName&order=start_date.desc"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Leaves fetch error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                Result.success(json.decodeFromString(bodyStr))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchApprovedTeamLeaves(): Result<List<LeaveRequest>> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/leave_requests?status=eq.approved"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Team leaves error: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                Result.success(json.decodeFromString(bodyStr))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkLeaveOverlap(agentName: String, startDate: String, endDate: String): Result<List<String>> =
        withContext(Dispatchers.IO) {
            try {
                val encodedName = URLEncoder.encode(agentName, "UTF-8")
                val url = "$baseUrl/rest/v1/leave_requests?status=eq.approved&agent_name=neq.$encodedName&start_date=lte.$endDate&end_date=gte.$startDate"
                val request = newRequestBuilder(url).get().build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        return@withContext Result.failure(IOException("Overlap check failed: ${response.code}"))
                    }
                    val bodyStr = response.body?.string().orEmpty()
                    val leaves = json.decodeFromString<List<LeaveRequest>>(bodyStr)
                    val overlappingAgents = leaves.map { it.agentName }.distinct()
                    Result.success(overlappingAgents)
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun submitLeaveRequest(
        agentName: String,
        startDate: String,
        endDate: String,
        reason: String,
        editingId: String? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val isEdit = editingId != null
            val url = if (isEdit) "$baseUrl/rest/v1/leave_requests?id=eq.$editingId" else "$baseUrl/rest/v1/leave_requests"
            val payload = LeaveRequest(
                agentName = agentName,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                status = "pending",
                isRead = false
            )
            val bodyJson = json.encodeToString(payload)
            val requestBody = bodyJson.toRequestBody("application/json".toMediaType())

            val reqBuilder = newRequestBuilder(url)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")

            val request = if (isEdit) reqBuilder.patch(requestBody).build() else reqBuilder.post(requestBody).build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val err = response.body?.string().orEmpty()
                    return@withContext Result.failure(IOException("Leave submission failed: $err"))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelLeaveRequest(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/leave_requests?id=eq.$id"
            val request = newRequestBuilder(url).delete().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Cancel leave failed: ${response.code}"))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkUnreadLeaves(agentName: String): Result<List<String>> = withContext(Dispatchers.IO) {
        try {
            val encodedName = URLEncoder.encode(agentName, "UTF-8")
            val url = "$baseUrl/rest/v1/leave_requests?agent_name=eq.$encodedName&is_read=is.false&select=id"
            val request = newRequestBuilder(url).get().build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Unread check failed: ${response.code}"))
                }
                val bodyStr = response.body?.string().orEmpty()
                val list = json.decodeFromString<List<Map<String, String>>>(bodyStr)
                Result.success(list.mapNotNull { it["id"] })
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markLeavesAsRead(ids: List<String>): Result<Unit> = withContext(Dispatchers.IO) {
        if (ids.isEmpty()) return@withContext Result.success(Unit)
        try {
            val idsParam = ids.joinToString(",")
            val url = "$baseUrl/rest/v1/leave_requests?id=in.($idsParam)"
            val body = """{"is_read":true}""".toRequestBody("application/json".toMediaType())

            val request = newRequestBuilder(url)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .patch(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(IOException("Mark read failed: ${response.code}"))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
