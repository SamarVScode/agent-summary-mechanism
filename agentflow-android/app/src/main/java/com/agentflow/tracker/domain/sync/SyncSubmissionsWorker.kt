package com.agentflow.tracker.domain.sync

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.LocalSubmissionsDbHelper
import com.agentflow.tracker.data.model.Submission
import java.io.File

class SyncSubmissionsWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SyncSubmissionsWorker"
        private const val UNIQUE_WORK_NAME = "agentflow_sync_submissions_work"

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<SyncSubmissionsWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context.applicationContext)
                .enqueueUniqueWork(UNIQUE_WORK_NAME, ExistingWorkPolicy.APPEND_OR_REPLACE, request)

            Log.d(TAG, "Enqueued background sync worker request")
        }
    }

    override suspend fun doWork(): Result {
        val dbHelper = LocalSubmissionsDbHelper.getInstance(applicationContext)
        val pendingList = dbHelper.getPendingSubmissions()

        if (pendingList.isEmpty()) {
            Log.d(TAG, "No pending submissions to sync.")
            return Result.success()
        }

        Log.d(TAG, "Found ${pendingList.size} pending submissions to sync.")
        val supabaseService = SupabaseService()
        var hasFailure = false

        for (pending in pendingList) {
            try {
                var remoteImageUrl = pending.imageUrl

                // 1. Upload local screenshot if exists and not yet uploaded
                val localPath = pending.localImagePath
                if (!localPath.isNullOrBlank() && (remoteImageUrl.isBlank() || !remoteImageUrl.startsWith("http"))) {
                    val file = File(localPath)
                    if (file.exists()) {
                        val bytes = file.readBytes()
                        val safeAgent = pending.agentName.trim().replace(Regex("[^a-zA-Z0-9]"), "_")
                        val fileName = "${safeAgent}_${pending.date}_${System.currentTimeMillis()}.jpg"

                        val uploadResult = supabaseService.uploadScreenshot(fileName, bytes, "image/jpeg")
                        if (uploadResult.isSuccess) {
                            remoteImageUrl = uploadResult.getOrThrow()
                            Log.d(TAG, "Successfully uploaded pending image: $remoteImageUrl")
                        } else {
                            Log.e(TAG, "Failed uploading pending image", uploadResult.exceptionOrNull())
                            hasFailure = true
                            continue
                        }
                    }
                }

                // 2. Insert record into Supabase submissions table
                val submission = Submission(
                    date = pending.date,
                    agentName = pending.agentName,
                    casperId = pending.casperId,
                    totalCount = pending.totalCount,
                    completedCount = pending.completedCount,
                    imageUrl = remoteImageUrl,
                    fileHash = pending.fileHash,
                    processed = false
                )

                val insertResult = supabaseService.insertSubmission(submission)
                if (insertResult.isSuccess) {
                    Log.d(TAG, "Successfully synced submission ${pending.id} to Supabase")
                    dbHelper.markSynced(pending.id, remoteImageUrl)

                    // Clean up temporary local image file
                    if (!localPath.isNullOrBlank()) {
                        try {
                            val f = File(localPath)
                            if (f.exists()) f.delete()
                        } catch (_: Exception) {}
                    }
                } else {
                    Log.e(TAG, "Failed to insert submission ${pending.id} into Supabase", insertResult.exceptionOrNull())
                    hasFailure = true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error syncing submission ${pending.id}", e)
                hasFailure = true
            }
        }

        return if (hasFailure) Result.retry() else Result.success()
    }
}
