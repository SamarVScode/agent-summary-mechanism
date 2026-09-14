package com.agentflow.tracker.domain.ocr

import android.content.Context
import android.net.Uri
import com.agentflow.tracker.data.model.OcrExtractedCounts
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class MlKitOcrExtractor(private val context: Context) {

    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun extractCounts(imageUri: Uri): Result<OcrExtractedCounts> {
        return try {
            val inputImage = InputImage.fromFilePath(context, imageUri)
            val result = suspendCancellableCoroutine { continuation ->
                recognizer.process(inputImage)
                    .addOnSuccessListener { visionText ->
                        val rawText = visionText.text
                        val counts = OcrParser.parseCountsFromOcr(rawText)
                        continuation.resume(counts)
                    }
                    .addOnFailureListener { error ->
                        continuation.resumeWithException(error)
                    }
            }
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
