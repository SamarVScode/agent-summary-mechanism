package com.agentflow.tracker.domain.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import kotlin.math.abs

object HashUtils {

    suspend fun calculateSha256(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        val digest = MessageDigest.getInstance("SHA-256")
        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        val hashBytes = digest.digest()
        hashBytes.joinToString("") { "%02x".format(it) }
    }

    fun calculateSha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(bytes)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    /**
     * Calculates a 64-bit Perceptual Difference Hash (dHash)
     * Resilient against JPEG recompression, WhatsApp transfers, and subtle scaling.
     */
    suspend fun calculatePerceptualHash(context: Context, uri: Uri): String? = withContext(Dispatchers.IO) {
        try {
            val stream = context.contentResolver.openInputStream(uri) ?: return@withContext null
            val bitmap = BitmapFactory.decodeStream(stream)
            stream.close()
            if (bitmap == null) return@withContext null

            // Resize to 9x8 for gradient difference hash
            val scaled = Bitmap.createScaledBitmap(bitmap, 9, 8, true)
            if (scaled != bitmap) bitmap.recycle()

            val diffBits = StringBuilder()
            for (y in 0 until 8) {
                for (x in 0 until 8) {
                    val pLeft = scaled.getPixel(x, y)
                    val pRight = scaled.getPixel(x + 1, y)

                    // Grayscale luminance (0.299R + 0.587G + 0.114B)
                    val lLeft = ((pLeft shr 16 and 0xFF) * 299 + (pLeft shr 8 and 0xFF) * 587 + (pLeft and 0xFF) * 114) / 1000
                    val lRight = ((pRight shr 16 and 0xFF) * 299 + (pRight shr 8 and 0xFF) * 587 + (pRight and 0xFF) * 114) / 1000

                    diffBits.append(if (lLeft > lRight) "1" else "0")
                }
            }
            scaled.recycle()

            // Convert 64-bit binary string to 16-character hex
            val hex = diffBits.toString().chunked(4).joinToString("") { chunk ->
                chunk.toInt(2).toString(16)
            }
            hex
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Generates a logical runsheet content signature:
     * Combines package metrics to identify duplicate runsheet records across historical submissions.
     */
    fun calculateRunsheetFingerprint(total: Int, completed: Int, failed: Int? = null, pending: Int? = null): String {
        return "FP_${total}_${completed}_${failed ?: 0}_${pending ?: 0}"
    }
}
