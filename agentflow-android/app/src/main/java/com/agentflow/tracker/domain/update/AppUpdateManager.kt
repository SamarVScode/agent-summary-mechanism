package com.agentflow.tracker.domain.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.FileProvider
import com.agentflow.tracker.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.concurrent.TimeUnit

sealed class UpdateState {
    object Idle : UpdateState()
    object Checking : UpdateState()
    data class Available(
        val versionName: String,
        val changelog: String,
        val downloadUrl: String,
        val fileSizeMb: Float
    ) : UpdateState()
    data class Downloading(
        val progress: Float,
        val downloadedMb: Float,
        val totalMb: Float
    ) : UpdateState()
    data class ReadyToInstall(val fileUri: Uri) : UpdateState()
    data class Error(val message: String) : UpdateState()
    object UpToDate : UpdateState()
}

class AppUpdateManager(private val context: Context) {

    private val _updateState = MutableStateFlow<UpdateState>(UpdateState.Idle)
    val updateState: StateFlow<UpdateState> = _updateState.asStateFlow()

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val githubRepo = "SamarVScode/agent-summary-mechanism"
    private val apiUrl = "https://api.github.com/repos/$githubRepo/releases/latest"

    fun resetState() {
        _updateState.value = UpdateState.Idle
    }

    suspend fun checkForUpdates(manualCheck: Boolean = false) = withContext(Dispatchers.IO) {
        _updateState.value = UpdateState.Checking
        try {
            val request = Request.Builder()
                .url(apiUrl)
                .header("Accept", "application/vnd.github.v3+json")
                .header("User-Agent", "AgentFlow-Android/${BuildConfig.VERSION_NAME}")
                .build()

            val response = client.newCall(request).execute()
            var jsonStr = if (response.isSuccessful) response.body?.string().orEmpty() else ""
            if (!response.isSuccessful && response.code == 404) {
                val fallbackReq = Request.Builder()
                    .url("https://api.github.com/repos/$githubRepo/releases")
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "AgentFlow-Android/${BuildConfig.VERSION_NAME}")
                    .build()
                val fallbackResp = client.newCall(fallbackReq).execute()
                if (fallbackResp.isSuccessful) {
                    val arr = org.json.JSONArray(fallbackResp.body?.string().orEmpty())
                    if (arr.length() > 0) {
                        jsonStr = arr.getJSONObject(0).toString()
                    }
                }
            }

            if (jsonStr.isBlank()) {
                if (manualCheck) {
                    _updateState.value = UpdateState.Error("No release found on GitHub (${response.code})")
                } else {
                    _updateState.value = UpdateState.Idle
                }
                return@withContext
            }

            val json = JSONObject(jsonStr)

            val rawTagName = json.optString("tag_name", "")
            val cleanRemoteVersion = rawTagName.trim().removePrefix("v").removePrefix("V")
            val rawBody = json.optString("body", "").trim()
            val body = if (rawBody.isNotBlank()) rawBody else "• Performance improvements and bug fixes."

            // Find APK in assets
            val assetsArray = json.optJSONArray("assets")
            var downloadUrl: String? = null
            var fileSizeMb = 0f

            if (assetsArray != null) {
                for (i in 0 until assetsArray.length()) {
                    val asset = assetsArray.getJSONObject(i)
                    val name = asset.optString("name", "")
                    if (name.endsWith(".apk", ignoreCase = true)) {
                        downloadUrl = asset.optString("browser_download_url")
                        val bytes = asset.optLong("size", 0L)
                        fileSizeMb = bytes / (1024f * 1024f)
                        break
                    }
                }
            }

            if (downloadUrl == null) {
                if (manualCheck) {
                    _updateState.value = UpdateState.UpToDate
                } else {
                    _updateState.value = UpdateState.Idle
                }
                return@withContext
            }

            val currentVersion = BuildConfig.VERSION_NAME.trim().removePrefix("v")
            if (isNewerVersion(cleanRemoteVersion, currentVersion)) {
                _updateState.value = UpdateState.Available(
                    versionName = cleanRemoteVersion,
                    changelog = body,
                    downloadUrl = downloadUrl,
                    fileSizeMb = fileSizeMb
                )
            } else {
                if (manualCheck) {
                    _updateState.value = UpdateState.UpToDate
                } else {
                    _updateState.value = UpdateState.Idle
                }
            }
        } catch (e: Exception) {
            Log.e("AppUpdateManager", "Update check failed", e)
            if (manualCheck) {
                _updateState.value = UpdateState.Error(e.message ?: "Failed to check for updates")
            } else {
                _updateState.value = UpdateState.Idle
            }
        }
    }

    suspend fun downloadAndInstall(downloadUrl: String) = withContext(Dispatchers.IO) {
        try {
            val updateDir = File(context.cacheDir, "updates").apply { mkdirs() }
            val apkFile = File(updateDir, "AgentFlow-update.apk")
            if (apkFile.exists()) apkFile.delete()

            val request = Request.Builder()
                .url(downloadUrl)
                .header("User-Agent", "AgentFlow-Android")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                _updateState.value = UpdateState.Error("Download failed with code: ${response.code}")
                return@withContext
            }

            val body = response.body ?: throw Exception("Empty response body")
            val totalBytes = body.contentLength()
            val totalMb = if (totalBytes > 0) totalBytes / (1024f * 1024f) else 15f

            var downloadedBytes = 0L
            val buffer = ByteArray(8 * 1024)

            val inputStream: InputStream = body.byteStream()
            val outputStream = FileOutputStream(apkFile)

            var lastReportTime = 0L

            inputStream.use { input ->
                outputStream.use { output ->
                    var bytesRead: Int
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        downloadedBytes += bytesRead

                        val now = System.currentTimeMillis()
                        if (now - lastReportTime > 150) { // report progress every 150ms
                            lastReportTime = now
                            val progress = if (totalBytes > 0) downloadedBytes.toFloat() / totalBytes else 0f
                            val downloadedMb = downloadedBytes / (1024f * 1024f)
                            _updateState.value = UpdateState.Downloading(
                                progress = progress.coerceIn(0f, 1f),
                                downloadedMb = downloadedMb,
                                totalMb = totalMb
                            )
                        }
                    }
                    output.flush()
                }
            }

            val authority = "${context.packageName}.fileprovider"
            val fileUri = FileProvider.getUriForFile(context, authority, apkFile)
            _updateState.value = UpdateState.ReadyToInstall(fileUri)

            triggerInstall(fileUri)
        } catch (e: Exception) {
            Log.e("AppUpdateManager", "APK download failed", e)
            _updateState.value = UpdateState.Error("Download failed: ${e.message}")
        }
    }

    fun triggerInstall(fileUri: Uri) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(fileUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e("AppUpdateManager", "Launch installer failed", e)
            _updateState.value = UpdateState.Error("Failed to launch installer: ${e.message}")
        }
    }

    private fun isNewerVersion(remote: String, current: String): Boolean {
        if (remote.isBlank() || current.isBlank()) return false
        val rParts = remote.split(".").mapNotNull { it.toIntOrNull() }
        val cParts = current.split(".").mapNotNull { it.toIntOrNull() }

        val length = maxOf(rParts.size, cParts.size)
        for (i in 0 until length) {
            val r = rParts.getOrElse(i) { 0 }
            val c = cParts.getOrElse(i) { 0 }
            if (r > c) return true
            if (r < c) return false
        }
        return false
    }
}
