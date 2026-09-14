package com.agentflow.tracker

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences
import com.agentflow.tracker.domain.update.AppUpdateManager

class AgentFlowApplication : Application(), ImageLoaderFactory {

    lateinit var userPreferences: UserPreferences
        private set

    lateinit var supabaseService: SupabaseService
        private set

    lateinit var appUpdateManager: AppUpdateManager
        private set

    override fun onCreate() {
        super.onCreate()
        userPreferences = UserPreferences(this)
        supabaseService = SupabaseService()
        appUpdateManager = AppUpdateManager(this)
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizeBytes(50L * 1024 * 1024)
                    .build()
            }
            .crossfade(true)
            .respectCacheHeaders(false)
            .build()
    }
}
