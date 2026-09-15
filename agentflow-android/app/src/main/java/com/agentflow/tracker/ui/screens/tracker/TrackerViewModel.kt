package com.agentflow.tracker.ui.screens.tracker

import android.content.Context
import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.LocalSubmission
import com.agentflow.tracker.data.local.LocalSubmissionsDbHelper
import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.ocr.MlKitOcrExtractor
import com.agentflow.tracker.domain.sync.SyncSubmissionsWorker
import com.agentflow.tracker.domain.utils.HashUtils
import com.agentflow.tracker.domain.utils.ImageMetadataUtils
import com.agentflow.tracker.domain.utils.NetworkUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

sealed class TrackerPhase {
    object Idle : TrackerPhase()
    object OcrProcessing : TrackerPhase()
    data class Review(val total: Int, val completed: Int) : TrackerPhase()
    object Submitting : TrackerPhase()
    data class Success(val total: Int, val completed: Int, val earnings: Double) : TrackerPhase()
}

data class TrackerUiState(
    val selectedDate: String = DateUtils.formatDate(),
    val imageUri: Uri? = null,
    val phase: TrackerPhase = TrackerPhase.Idle,
    val errorMessage: String? = null
)

class TrackerViewModel(
    private val supabaseService: SupabaseService,
    private val ocrExtractor: MlKitOcrExtractor,
    private val context: Context,
    private val agentName: String,
    private val casperId: String,
    private val rateAmount: Double
) : ViewModel() {

    private val _uiState = MutableStateFlow(TrackerUiState())
    val uiState: StateFlow<TrackerUiState> = _uiState.asStateFlow()

    private var currentFileHash: String = ""

    fun onDateSelected(dateStr: String) {
        _uiState.value = _uiState.value.copy(selectedDate = dateStr)
    }

    fun onImageSelected(uri: Uri) {
        _uiState.value = _uiState.value.copy(
            imageUri = uri,
            phase = TrackerPhase.OcrProcessing,
            errorMessage = null
        )

        viewModelScope.launch {
            try {
                // 1. Strict Metadata Date Validation (real EXIF & MediaStore DATE_TAKEN only)
                val metadataDate = ImageMetadataUtils.extractCaptureDate(context, uri)
                if (!metadataDate.isNullOrBlank() && metadataDate != _uiState.value.selectedDate) {
                    _uiState.value = _uiState.value.copy(
                        phase = TrackerPhase.Idle,
                        errorMessage = "Date Mismatch: This screenshot was taken on $metadataDate, but you selected ${_uiState.value.selectedDate}. Please select $metadataDate in the date picker to upload this runsheet."
                    )
                    return@launch
                }

                // 2. Calculate SHA-256
                val hash = HashUtils.calculateSha256(context, uri)
                currentFileHash = hash

                // 3. Check for duplicates in Local DB first (works 100% offline!)
                val dbHelper = LocalSubmissionsDbHelper.getInstance(context)
                if (dbHelper.hasFileHash(hash)) {
                    _uiState.value = _uiState.value.copy(
                        phase = TrackerPhase.Idle,
                        errorMessage = "Duplicate screenshot: This exact image has already been submitted in payout history."
                    )
                    return@launch
                }

                // 4. Check for duplicates in Supabase if online
                if (NetworkUtils.isOnline(context)) {
                    val dupCheck = supabaseService.checkDuplicateHash(hash)
                    if (dupCheck.getOrDefault(false)) {
                        _uiState.value = _uiState.value.copy(
                            phase = TrackerPhase.Idle,
                            errorMessage = "Duplicate screenshot: This exact image has already been submitted in payout history."
                        )
                        return@launch
                    }
                }

                // 5. Process with ML Kit OCR (spatial grid + mathematical validation)
                val ocrResult = ocrExtractor.extractCounts(uri)
                ocrResult.onSuccess { counts ->
                    val pending = counts.pendingCount ?: 0
                    if (pending > 0) {
                        _uiState.value = _uiState.value.copy(
                            phase = TrackerPhase.Idle,
                            errorMessage = "Incomplete Runsheet: You have $pending pending task(s). Please complete all pending deliveries before submitting."
                        )
                        return@onSuccess
                    }

                    val total = counts.totalCount ?: 0
                    val completed = counts.completedCount ?: 0
                    if (total > 0 || completed > 0) {
                        _uiState.value = _uiState.value.copy(
                            phase = TrackerPhase.Review(total, completed)
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            phase = TrackerPhase.Review(0, 0),
                            errorMessage = "Couldn't auto-detect counts. Please verify and enter numbers manually."
                        )
                    }
                }.onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        phase = TrackerPhase.Review(0, 0),
                        errorMessage = "OCR couldn't read numbers. Please enter counts manually."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    phase = TrackerPhase.Idle,
                    errorMessage = "Error processing image: ${e.message}"
                )
            }
        }
    }

    fun submitCounts(total: Int, completed: Int) {
        val uri = _uiState.value.imageUri ?: return
        _uiState.value = _uiState.value.copy(phase = TrackerPhase.Submitting)

        viewModelScope.launch {
            try {
                val dateFormatted = _uiState.value.selectedDate
                val dbHelper = LocalSubmissionsDbHelper.getInstance(context)

                // 1. Strict deduplication: Local DB check (works offline!)
                if (dbHelper.hasSubmission(casperId, dateFormatted, total, completed)) {
                    _uiState.value = _uiState.value.copy(
                        phase = TrackerPhase.Idle,
                        errorMessage = "Duplicate submission: A runsheet for $dateFormatted with $total total and $completed completed deliveries was already submitted."
                    )
                    return@launch
                }

                // 2. Strict deduplication: Supabase check (if online)
                if (NetworkUtils.isOnline(context)) {
                    val dupSubmission = supabaseService.checkDuplicateSubmission(casperId, dateFormatted, total, completed)
                    if (dupSubmission.getOrDefault(false)) {
                        _uiState.value = _uiState.value.copy(
                            phase = TrackerPhase.Idle,
                            errorMessage = "Duplicate submission: A runsheet for $dateFormatted with $total total and $completed completed deliveries was already submitted."
                        )
                        return@launch
                    }
                }

                // 3. Compress & downsample image before storage
                val bytes = withContext(Dispatchers.IO) {
                    val stream = context.contentResolver.openInputStream(uri) ?: return@withContext null
                    val original = BitmapFactory.decodeStream(stream)
                    stream.close()
                    if (original == null) return@withContext null

                    val maxDim = 1280
                    val width = original.width
                    val height = original.height
                    val scaled = if (width > maxDim || height > maxDim) {
                        val ratio = width.toFloat() / height.toFloat()
                        val (newW, newH) = if (ratio > 1) {
                            Pair(maxDim, (maxDim / ratio).toInt())
                        } else {
                            Pair((maxDim * ratio).toInt(), maxDim)
                        }
                        Bitmap.createScaledBitmap(original, newW, newH, true)
                    } else {
                        original
                    }

                    val out = ByteArrayOutputStream()
                    scaled.compress(Bitmap.CompressFormat.JPEG, 82, out)
                    if (scaled != original) scaled.recycle()
                    original.recycle()
                    out.toByteArray()
                } ?: throw Exception("Failed to process image data")

                // 4. Save downsampled screenshot locally to internal storage
                val submissionId = java.util.UUID.randomUUID().toString()
                val pendingDir = java.io.File(context.filesDir, "pending_uploads").apply {
                    if (!exists()) mkdirs()
                }
                val localImageFile = java.io.File(pendingDir, "pending_${submissionId}.jpg")
                withContext(Dispatchers.IO) {
                    localImageFile.writeBytes(bytes)
                }

                // 5. Insert into Local DB as PENDING (Single Source of Truth)
                val nowStr = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date())
                val localSubmission = LocalSubmission(
                    id = submissionId,
                    date = dateFormatted,
                    agentName = agentName,
                    casperId = casperId,
                    totalCount = total,
                    completedCount = completed,
                    imageUrl = "",
                    localImagePath = localImageFile.absolutePath,
                    fileHash = currentFileHash,
                    syncStatus = "PENDING",
                    createdAt = nowStr
                )
                dbHelper.insert(localSubmission)

                // 6. Schedule background sync via WorkManager
                SyncSubmissionsWorker.enqueue(context)

                // 7. Transition immediately to Success screen (zero network wait time, 100% offline resilient!)
                val earnings = completed * rateAmount
                _uiState.value = _uiState.value.copy(
                    phase = TrackerPhase.Success(total, completed, earnings)
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    phase = TrackerPhase.Review(total, completed),
                    errorMessage = e.message ?: "Submission failed"
                )
            }
        }
    }

    fun dismissReview() {
        _uiState.value = _uiState.value.copy(phase = TrackerPhase.Idle)
    }

    fun reset() {
        _uiState.value = TrackerUiState(
            selectedDate = DateUtils.formatDate(),
            imageUri = null,
            phase = TrackerPhase.Idle,
            errorMessage = null
        )
        currentFileHash = ""
    }
}
