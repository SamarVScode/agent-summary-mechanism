package com.agentflow.tracker

import android.app.Application
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences

class AgentFlowApplication : Application() {

    lateinit var userPreferences: UserPreferences
        private set

    lateinit var supabaseService: SupabaseService
        private set

    override fun onCreate() {
        super.onCreate()
        userPreferences = UserPreferences(this)
        supabaseService = SupabaseService()
    }
}
