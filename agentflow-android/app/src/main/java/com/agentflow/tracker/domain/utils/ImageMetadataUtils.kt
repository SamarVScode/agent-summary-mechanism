package com.agentflow.tracker.domain.utils

import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object ImageMetadataUtils {

    private const val TAG = "ImageMetadataUtils"

    /**
     * Extracts the real screenshot/photo capture date in "yyyy-MM-dd" format.
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
                        val timestampMs = cursor.getLong(dateTakenCol)
                        if (timestampMs > 0) {
                            val formatted = formatEpochToIsoDate(timestampMs)
                            Log.d(TAG, "Captured via MediaStore DATE_TAKEN: $formatted ($timestampMs)")
                            return formatted
                        }
                    }

                    // Fallback to DATE_MODIFIED / DATE_ADDED if DATE_TAKEN was 0
                    val dateModifiedCol = cursor.getColumnIndex(MediaStore.Images.Media.DATE_MODIFIED)
                    if (dateModifiedCol != -1) {
                        val timestampSec = cursor.getLong(dateModifiedCol)
                        if (timestampSec > 0) {
                            val formatted = formatEpochToIsoDate(timestampSec * 1000)
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
                    val parsedDate = parseExifDate(exifDateStr)
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

    private fun formatEpochToIsoDate(epochMs: Long): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        sdf.timeZone = TimeZone.getDefault()
        return sdf.format(Date(epochMs))
    }

    private fun parseExifDate(exifDateStr: String): String? {
        // Standard EXIF format: "yyyy:MM:dd HH:mm:ss"
        return try {
            val sdf = SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US)
            val date = sdf.parse(exifDateStr)
            if (date != null) {
                val outFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                outFormat.timeZone = TimeZone.getDefault()
                outFormat.format(date)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
