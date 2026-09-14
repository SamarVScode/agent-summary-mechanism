package com.agentflow.tracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.agentflow.tracker.ui.navigation.AgentFlowNavGraph
import com.agentflow.tracker.ui.theme.AgentFlowTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as AgentFlowApplication
        val userPreferences = app.userPreferences
        val supabaseService = app.supabaseService

        setContent {
            val themeSetting by userPreferences.themeFlow.collectAsState(initial = "system")
            val isDark = when (themeSetting) {
                "dark" -> true
                "light" -> false
                else -> isSystemInDarkTheme()
            }

            AgentFlowTheme(darkTheme = isDark) {
                AgentFlowNavGraph(
                    userPreferences = userPreferences,
                    supabaseService = supabaseService
                )
            }
        }
    }
}
