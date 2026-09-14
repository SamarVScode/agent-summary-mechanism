package com.agentflow.tracker.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.ocr.MlKitOcrExtractor
import com.agentflow.tracker.ui.components.AgentFlowBottomBar
import com.agentflow.tracker.ui.components.AgentFlowTopBar
import com.agentflow.tracker.ui.screens.dashboard.DashboardScreen
import com.agentflow.tracker.ui.screens.dashboard.DashboardViewModel
import com.agentflow.tracker.ui.screens.leave.LeaveScreen
import com.agentflow.tracker.ui.screens.leave.LeaveViewModel
import com.agentflow.tracker.ui.screens.login.LoginScreen
import com.agentflow.tracker.ui.screens.login.LoginViewModel
import com.agentflow.tracker.ui.screens.profile.ProfileScreen
import com.agentflow.tracker.ui.screens.profile.ProfileViewModel
import com.agentflow.tracker.ui.screens.tracker.TrackerScreen
import com.agentflow.tracker.ui.screens.tracker.TrackerViewModel
import kotlinx.coroutines.launch

@Composable
fun AgentFlowNavGraph(
    userPreferences: UserPreferences,
    supabaseService: SupabaseService,
    navController: NavHostController = rememberNavController()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val agentName by userPreferences.agentNameFlow.collectAsState(initial = "")
    val casperId by userPreferences.casperIdFlow.collectAsState(initial = "")
    val rateAmount by userPreferences.rateAmountFlow.collectAsState(initial = 13.0)

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Tracker.route

    val isLoggedIn = agentName.isNotBlank() && casperId.isNotBlank()
    val startDestination = if (isLoggedIn) Screen.Tracker.route else Screen.Login.route

    // Leave ViewModel shared for unread notification count
    val leaveViewModel = remember(agentName) {
        LeaveViewModel(supabaseService, agentName)
    }
    val leaveUiState by leaveViewModel.uiState.collectAsState()

    if (!isLoggedIn) {
        val loginViewModel = remember {
            LoginViewModel(supabaseService, userPreferences)
        }
        LoginScreen(
            viewModel = loginViewModel,
            onLoginSuccess = {
                navController.navigate(Screen.Tracker.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            }
        )
    } else {
        Scaffold(
            topBar = {
                AgentFlowTopBar(
                    agentName = agentName,
                    currentDate = DateUtils.formatDate(),
                    onLogout = {
                        scope.launch {
                            userPreferences.clearAgentInfo()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    }
                )
            },
            bottomBar = {
                AgentFlowBottomBar(
                    currentRoute = currentRoute,
                    hasUnreadLeaves = leaveUiState.hasUnreadLeaves,
                    onNavigate = { route ->
                        if (currentRoute != route) {
                            navController.navigate(route) {
                                popUpTo(Screen.Tracker.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                NavHost(
                    navController = navController,
                    startDestination = Screen.Tracker.route
                ) {
                    composable(Screen.Dashboard.route) {
                        val dashboardViewModel = remember(agentName, rateAmount) {
                            DashboardViewModel(supabaseService, agentName, rateAmount)
                        }
                        DashboardScreen(viewModel = dashboardViewModel)
                    }

                    composable(Screen.Tracker.route) {
                        val ocrExtractor = remember { MlKitOcrExtractor(context) }
                        val trackerViewModel = remember(agentName, casperId, rateAmount) {
                            TrackerViewModel(
                                supabaseService = supabaseService,
                                ocrExtractor = ocrExtractor,
                                context = context,
                                agentName = agentName,
                                casperId = casperId,
                                rateAmount = rateAmount
                            )
                        }
                        TrackerScreen(
                            viewModel = trackerViewModel,
                            agentName = agentName
                        )
                    }

                    composable(Screen.Leave.route) {
                        LeaveScreen(viewModel = leaveViewModel)
                    }

                    composable(Screen.Profile.route) {
                        val profileViewModel = remember(agentName, casperId, rateAmount) {
                            ProfileViewModel(
                                supabaseService = supabaseService,
                                userPreferences = userPreferences,
                                agentName = agentName,
                                casperId = casperId,
                                rateAmount = rateAmount
                            )
                        }
                        ProfileScreen(
                            viewModel = profileViewModel,
                            onLogout = {
                                scope.launch {
                                    userPreferences.clearAgentInfo()
                                    navController.navigate(Screen.Login.route) {
                                        popUpTo(0) { inclusive = true }
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
