package com.agentflow.tracker.ui.screens.tracker

import android.content.Context
import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.model.Submission
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.ocr.MlKitOcrExtractor
import com.agentflow.tracker.domain.utils.HashUtils
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
                // 1. Calculate SHA-256
                val hash = HashUtils.calculateSha256(context, uri)
                currentFileHash = hash

                // 2. Check for duplicates in Supabase
                val dupCheck = supabaseService.checkDuplicateHash(hash)
                if (dupCheck.getOrDefault(false)) {
                    _uiState.value = _uiState.value.copy(
                        phase = TrackerPhase.Idle,
                        errorMessage = "This screenshot has already been submitted."
                    )
                    return@launch
                }

                // 3. Process with ML Kit OCR
                val ocrResult = ocrExtractor.extractCounts(uri)
                ocrResult.onSuccess { counts ->
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
                // Compress & downsample image before upload to avoid memory pressure & GC pauses
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

                val safeAgent = agentName.trim().replace(Regex("[^a-zA-Z0-9]"), "_")
                val dateFormatted = _uiState.value.selectedDate
                val fileName = "${safeAgent}_${dateFormatted}_${System.currentTimeMillis()}.jpg"

                // Upload to Supabase Storage
                val uploadResult = supabaseService.uploadScreenshot(fileName, bytes, "image/jpeg")
                if (uploadResult.isFailure) {
                    throw uploadResult.exceptionOrNull() ?: Exception("Upload failed")
                }
                val publicUrl = uploadResult.getOrThrow()

                // Insert into submissions table
                val submission = Submission(
                    date = dateFormatted,
                    agentName = agentName,
                    casperId = casperId,
                    totalCount = total,
                    completedCount = completed,
                    imageUrl = publicUrl,
                    fileHash = currentFileHash,
                    processed = false
                )

                val insertResult = supabaseService.insertSubmission(submission)
                if (insertResult.isFailure) {
                    throw insertResult.exceptionOrNull() ?: Exception("Failed to save submission record")
                }

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
