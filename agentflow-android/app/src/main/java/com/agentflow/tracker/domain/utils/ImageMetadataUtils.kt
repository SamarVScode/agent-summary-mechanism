package com.agentflow.tracker.domain.utils

import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.agentflow.tracker.domain.date.DateUtils
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object ImageMetadataUtils {

    private const val TAG = "ImageMetadataUtils"

    // Recognized EXIF date patterns across various Android OEM camera implementations
    private val EXIF_DATE_PATTERNS = listOf(
        "yyyy:MM:dd HH:mm:ss",
        "yyyy:MM:dd",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd",
        "yyyy/MM/dd HH:mm:ss",
        "yyyy/MM/dd",
        "dd-MM-yyyy HH:mm:ss",
        "dd-MM-yyyy",
        "dd/MM/yyyy HH:mm:ss",
        "dd/MM/yyyy",
        "dd-MMM-yyyy"
    )

    /**
     * Extracts the real screenshot/photo capture date formatted in canonical "dd-MMM-yyyy"
     * (e.g., "15-Sep-2026") matching the app's standard date format.
     * Strictly uses system MediaStore capture records and embedded binary EXIF headers.
     * ZERO filename parsing or guessing is performed.
     */
    fun extractCaptureDate(context: Context, uri: Uri): String? {
        // 1. Check MediaStore system capture timestamp (DATE_TAKEN)
        try {
            val projection = arrayOf(
                MediaStore.Images.Media.DATE_TAKEN,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.DATE_MODIFIED
            )
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val dateTakenCol = cursor.getColumnIndex(MediaStore.Images.Media.DATE_TAKEN)
                    if (dateTakenCol != -1) {
                        val timestamp = cursor.getLong(dateTakenCol)
                        if (timestamp > 0) {
                            val formatted = normalizeEpochToAppDate(timestamp)
                            Log.d(TAG, "Captured via MediaStore DATE_TAKEN: $formatted ($timestamp)")
                            return formatted
                        }
                    }

                    // Fallback to DATE_MODIFIED / DATE_ADDED if DATE_TAKEN was 0
                    val dateModifiedCol = cursor.getColumnIndex(MediaStore.Images.Media.DATE_MODIFIED)
                    if (dateModifiedCol != -1) {
                        val timestamp = cursor.getLong(dateModifiedCol)
                        if (timestamp > 0) {
                            val formatted = normalizeEpochToAppDate(timestamp)
                            Log.d(TAG, "Captured via MediaStore DATE_MODIFIED: $formatted")
                            return formatted
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed reading MediaStore metadata: ${e.message}")
        }

        // 2. Check embedded binary EXIF header
        try {
            context.contentResolver.openInputStream(uri)?.use { inputStream ->
                val exif = ExifInterface(inputStream)
                val exifDateStr = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
                    ?: exif.getAttribute(ExifInterface.TAG_DATETIME_DIGITIZED)
                    ?: exif.getAttribute(ExifInterface.TAG_DATETIME)

                if (!exifDateStr.isNullOrBlank()) {
                    val parsedDate = parseExifDate(exifDateStr.trim())
                    if (parsedDate != null) {
                        Log.d(TAG, "Captured via EXIF timestamp: $parsedDate ($exifDateStr)")
                        return parsedDate
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed reading EXIF metadata: ${e.message}")
        }

        return null
    }

    private fun normalizeEpochToAppDate(rawTimestamp: Long): String {
        // If timestamp is in seconds (< 100 billion), convert to milliseconds
        val epochMs = if (rawTimestamp < 100_000_000_000L) rawTimestamp * 1000L else rawTimestamp
        return DateUtils.formatDate(Date(epochMs))
    }

    private fun parseExifDate(exifDateStr: String): String? {
        for (pattern in EXIF_DATE_PATTERNS) {
            try {
                val sdf = SimpleDateFormat(pattern, Locale.US).apply {
                    timeZone = TimeZone.getDefault()
                    isLenient = false
                }
                val date = sdf.parse(exifDateStr)
                if (date != null) {
                    return DateUtils.formatDate(date)
                }
            } catch (_: Exception) {
                // Try next pattern
            }
        }
        return null
    }
}
