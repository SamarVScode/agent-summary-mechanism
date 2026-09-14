package com.agentflow.tracker.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard") // History
    object Tracker : Screen("tracker")     // Log Work
    object Leave : Screen("leave")         // Leave
    object Profile : Screen("profile")     // Profile
}
