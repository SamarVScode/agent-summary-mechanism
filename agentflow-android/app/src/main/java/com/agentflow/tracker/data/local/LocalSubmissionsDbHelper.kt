package com.agentflow.tracker.data.local

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.agentflow.tracker.data.model.Submission
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class LocalSubmissionsDbHelper(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {

    companion object {
        private const val DATABASE_NAME = "agentflow_local.db"
        private const val DATABASE_VERSION = 1
        private const val TABLE_NAME = "submissions_cache"

        private const val COL_ID = "id"
        private const val COL_DATE = "date"
        private const val COL_AGENT_NAME = "agent_name"
        private const val COL_CASPER_ID = "casper_id"
        private const val COL_TOTAL_COUNT = "total_count"
        private const val COL_COMPLETED_COUNT = "completed_count"
        private const val COL_IMAGE_URL = "image_url"
        private const val COL_LOCAL_IMAGE_PATH = "local_image_path"
        private const val COL_FILE_HASH = "file_hash"
        private const val COL_SYNC_STATUS = "sync_status"
        private const val COL_CREATED_AT = "created_at"

        @Volatile
        private var instance: LocalSubmissionsDbHelper? = null

        fun getInstance(context: Context): LocalSubmissionsDbHelper {
            return instance ?: synchronized(this) {
                instance ?: LocalSubmissionsDbHelper(context).also { instance = it }
            }
        }
    }

    // Reactive state flow that increments whenever database changes
    private val _dbUpdateTrigger = MutableStateFlow(System.currentTimeMillis())
    val dbUpdateTrigger: StateFlow<Long> = _dbUpdateTrigger.asStateFlow()

    private fun notifyChanged() {
        _dbUpdateTrigger.value = System.currentTimeMillis()
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTableSql = """
            CREATE TABLE IF NOT EXISTS $TABLE_NAME (
                $COL_ID TEXT PRIMARY KEY,
                $COL_DATE TEXT NOT NULL,
                $COL_AGENT_NAME TEXT NOT NULL,
                $COL_CASPER_ID TEXT NOT NULL,
                $COL_TOTAL_COUNT INTEGER NOT NULL,
                $COL_COMPLETED_COUNT INTEGER NOT NULL,
                $COL_IMAGE_URL TEXT,
                $COL_LOCAL_IMAGE_PATH TEXT,
                $COL_FILE_HASH TEXT,
                $COL_SYNC_STATUS TEXT NOT NULL,
                $COL_CREATED_AT TEXT NOT NULL
            )
        """.trimIndent()
        db.execSQL(createTableSql)
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_file_hash ON $TABLE_NAME($COL_FILE_HASH)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_casper_date ON $TABLE_NAME($COL_CASPER_ID, $COL_DATE)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_sync_status ON $TABLE_NAME($COL_SYNC_STATUS)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_NAME")
        onCreate(db)
    }

    fun insert(submission: LocalSubmission): Long {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put(COL_ID, submission.id)
            put(COL_DATE, submission.date)
            put(COL_AGENT_NAME, submission.agentName)
            put(COL_CASPER_ID, submission.casperId)
            put(COL_TOTAL_COUNT, submission.totalCount)
            put(COL_COMPLETED_COUNT, submission.completedCount)
            put(COL_IMAGE_URL, submission.imageUrl)
            put(COL_LOCAL_IMAGE_PATH, submission.localImagePath)
            put(COL_FILE_HASH, submission.fileHash)
            put(COL_SYNC_STATUS, submission.syncStatus)
            put(COL_CREATED_AT, submission.createdAt)
        }
        val res = db.insertWithOnConflict(TABLE_NAME, null, cv, SQLiteDatabase.CONFLICT_REPLACE)
        notifyChanged()
        return res
    }

    fun markSynced(id: String, remoteImageUrl: String) {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put(COL_IMAGE_URL, remoteImageUrl)
            put(COL_SYNC_STATUS, "SYNCED")
        }
        db.update(TABLE_NAME, cv, "$COL_ID = ?", arrayOf(id))
        notifyChanged()
    }

    fun getPendingSubmissions(): List<LocalSubmission> {
        val db = readableDatabase
        val list = mutableListOf<LocalSubmission>()
        db.query(
            TABLE_NAME,
            null,
            "$COL_SYNC_STATUS = ?",
            arrayOf("PENDING"),
            null,
            null,
            "$COL_CREATED_AT ASC"
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                list.add(cursorToSubmission(cursor))
            }
        }
        return list
    }

    fun getAllSubmissions(casperId: String): List<LocalSubmission> {
        val db = readableDatabase
        val list = mutableListOf<LocalSubmission>()
        db.query(
            TABLE_NAME,
            null,
            "$COL_CASPER_ID = ?",
            arrayOf(casperId),
            null,
            null,
            "$COL_DATE DESC, $COL_CREATED_AT DESC"
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                list.add(cursorToSubmission(cursor))
            }
        }
        return list
    }

    fun hasFileHash(fileHash: String): Boolean {
        if (fileHash.isBlank()) return false
        val db = readableDatabase
        db.query(
            TABLE_NAME,
            arrayOf(COL_ID),
            "$COL_FILE_HASH = ?",
            arrayOf(fileHash),
            null,
            null,
            null,
            "1"
        )?.use { cursor ->
            return cursor.moveToFirst()
        }
        return false
    }

    fun hasSubmission(casperId: String, date: String, total: Int, completed: Int): Boolean {
        val db = readableDatabase
        db.query(
            TABLE_NAME,
            arrayOf(COL_ID),
            "$COL_CASPER_ID = ? AND $COL_DATE = ? AND $COL_TOTAL_COUNT = ? AND $COL_COMPLETED_COUNT = ?",
            arrayOf(casperId, date, total.toString(), completed.toString()),
            null,
            null,
            null,
            "1"
        )?.use { cursor ->
            return cursor.moveToFirst()
        }
        return false
    }

    fun syncFromRemote(remoteList: List<Submission>, casperId: String) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (remote in remoteList) {
                val cv = ContentValues().apply {
                    put(COL_ID, remote.id ?: UUID.randomUUID().toString())
                    put(COL_DATE, remote.date)
                    put(COL_AGENT_NAME, remote.agentName)
                    put(COL_CASPER_ID, remote.casperId.ifEmpty { casperId })
                    put(COL_TOTAL_COUNT, remote.totalCount)
                    put(COL_COMPLETED_COUNT, remote.completedCount)
                    put(COL_IMAGE_URL, remote.imageUrl)
                    put(COL_FILE_HASH, remote.fileHash)
                    put(COL_SYNC_STATUS, "SYNCED")
                    put(COL_CREATED_AT, remote.createdAt ?: "")
                }
                // Do not overwrite pending local submissions
                db.insertWithOnConflict(TABLE_NAME, null, cv, SQLiteDatabase.CONFLICT_IGNORE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        notifyChanged()
    }

    fun deleteById(id: String) {
        val db = writableDatabase
        db.delete(TABLE_NAME, "$COL_ID = ?", arrayOf(id))
        notifyChanged()
    }

    private fun cursorToSubmission(cursor: android.database.Cursor): LocalSubmission {
        return LocalSubmission(
            id = cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)),
            date = cursor.getString(cursor.getColumnIndexOrThrow(COL_DATE)),
            agentName = cursor.getString(cursor.getColumnIndexOrThrow(COL_AGENT_NAME)),
            casperId = cursor.getString(cursor.getColumnIndexOrThrow(COL_CASPER_ID)),
            totalCount = cursor.getInt(cursor.getColumnIndexOrThrow(COL_TOTAL_COUNT)),
            completedCount = cursor.getInt(cursor.getColumnIndexOrThrow(COL_COMPLETED_COUNT)),
            imageUrl = cursor.getString(cursor.getColumnIndexOrThrow(COL_IMAGE_URL)).orEmpty(),
            localImagePath = cursor.getString(cursor.getColumnIndexOrThrow(COL_LOCAL_IMAGE_PATH)),
            fileHash = cursor.getString(cursor.getColumnIndexOrThrow(COL_FILE_HASH)).orEmpty(),
            syncStatus = cursor.getString(cursor.getColumnIndexOrThrow(COL_SYNC_STATUS)),
            createdAt = cursor.getString(cursor.getColumnIndexOrThrow(COL_CREATED_AT)).orEmpty()
        )
    }
}
